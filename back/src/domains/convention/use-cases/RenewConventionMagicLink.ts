import { TokenExpiredError, decode } from "jsonwebtoken";
import {
  AppSupportedJwt,
  ConventionId,
  ConventionJwtPayload,
  ForbiddenError,
  InternshipKind,
  RenewMagicLinkRequestDto,
  Role,
  errors,
  frontRoutes,
  makeEmailHash,
  renewMagicLinkRequestSchema,
} from "shared";
import { AppConfig } from "../../../config/bootstrap/appConfig";
import { verifyJwtConfig } from "../../../config/bootstrap/authMiddleware";
import { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { conventionEmailsByRoleForMagicLinkRenewal } from "../../../utils/convention";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { prepareMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class RenewConventionMagicLink extends TransactionalUseCase<
  RenewMagicLinkRequestDto,
  void
> {
  protected inputSchema = renewMagicLinkRequestSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #makeGenerateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #config: AppConfig;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    makeGenerateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    config: AppConfig,
    timeGateway: TimeGateway,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
  ) {
    super(uowPerformer);
    this.#config = config;
    this.#createNewEvent = createNewEvent;
    this.#makeGenerateConventionMagicLinkUrl =
      makeGenerateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
  }

  protected async _execute(
    { expiredJwt, originalUrl }: RenewMagicLinkRequestDto,
    uow: UnitOfWork,
  ) {
    const { emailHash, role, applicationId } = extractDataFromExpiredJwt(
      extractConventionJwtPayloadFromExpiredJwt(this.#config, expiredJwt),
    );

    const convention = await uow.conventionRepository.getById(applicationId);
    if (!convention)
      throw errors.convention.notFound({ conventionId: applicationId });

    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const emails = conventionEmailsByRoleForMagicLinkRenewal(
      convention,
      await agencyWithRightToAgencyDto(uow, agency),
    )[role];
    if (emails instanceof Error) throw emails;

    // Only renew the link if the email hash matches
    await this.#onEmails(
      emails,
      emailHash,
      applicationId,
      role,
      this.#findRouteToRenew(originalUrl),
      uow,
      convention.internshipKind,
    );
  }

  async #onEmails(
    emails: string[],
    emailHash: string | undefined,
    conventionId: ConventionId,
    role: Role,
    route: string,
    uow: UnitOfWork,
    internshipKind: InternshipKind,
  ) {
    let foundHit = false;
    for (const email of emails) {
      if (!emailHash || makeEmailHash(email) === emailHash) {
        foundHit = true;

        const makeMagicShortLink = prepareMagicShortLinkMaker({
          conventionMagicLinkPayload: {
            id: conventionId,
            role,
            email,
            now: this.#timeGateway.now(),
          },
          uow,
          config: this.#config,
          generateConventionMagicLinkUrl:
            this.#makeGenerateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
        });

        await uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "MagicLinkRenewalRequested",
            payload: {
              internshipKind,
              emails,
              magicLink: await makeMagicShortLink({
                targetRoute: route,
                lifetime: "short",
              }),
              conventionStatusLink: await makeMagicShortLink({
                targetRoute: frontRoutes.conventionStatusDashboard,
                lifetime: "long",
              }),
              conventionId,
              triggeredBy: { kind: "convention-magic-link", role },
            },
          }),
        );
      }
    }
    if (!foundHit) throw errors.convention.magicLinkNotAssociatedToConvention();
  }

  #findRouteToRenew(originalUrl: string) {
    const supportedRenewRoutes: string[] = [
      frontRoutes.conventionImmersionRoute,
      frontRoutes.conventionToSign,
      frontRoutes.manageConvention,
      frontRoutes.assessment,
    ];

    const supportedRouteToRenew = supportedRenewRoutes.find((supportedRoute) =>
      decodeURIComponent(originalUrl).includes(`/${supportedRoute}`),
    );

    if (!supportedRouteToRenew)
      throw errors.convention.unsupportedRenewRoute({
        supportedRenewRoutes,
        originalUrl,
      });
    return supportedRouteToRenew;
  }
}

// Extracts the data necessary for link renewal from any version of magic link payload.
type LinkRenewData = {
  role: Role;
  applicationId: ConventionId;
  emailHash?: string;
};
const extractDataFromExpiredJwt = (
  payload: ConventionJwtPayload,
): LinkRenewData =>
  // Once there are more JWT versions, expand this code to upgrade old JWTs, e.g.:
  // else if (payload.version === 1) {...}
  ({
    role: payload.role,
    applicationId: payload.applicationId,
    emailHash: payload.emailHash,
  });

const extractConventionJwtPayloadFromExpiredJwt = (
  config: AppConfig,
  expiredJwt: AppSupportedJwt,
): ConventionJwtPayload => {
  const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(config);
  let payloadToExtract: ConventionJwtPayload | undefined;
  try {
    // If the following doesn't throw, we're dealing with a JWT that we signed, so it's
    // probably expired or an old version.
    payloadToExtract = verifyJwt(expiredJwt) as ConventionJwtPayload;
  } catch (err) {
    // If this JWT is signed by us but expired, deal with it.
    if (err instanceof TokenExpiredError) {
      payloadToExtract = decode(expiredJwt) as ConventionJwtPayload;
    } else {
      // Perhaps this is a JWT that is signed by a compromised key.
      try {
        verifyDeprecatedJwt(expiredJwt);
        // If the above didn't throw, this is a JWT that we issued. Renew it.
        // However, we cannot trust the contents of it, as the private key was potentially
        // compromised. Therefore, only use the convention ID and the role from it, and fill
        // the remaining data from the database to prevent a hacker from getting magic links
        // for any convention form.
        payloadToExtract = decode(expiredJwt) as ConventionJwtPayload;
      } catch (_) {
        // We don't want to renew this JWT.
        throw new ForbiddenError();
      }
    }
  }
  // Convention JWT payload is not validated
  if (payloadToExtract) return payloadToExtract;
  throw errors.convention.malformedExpiredJwt();
};
