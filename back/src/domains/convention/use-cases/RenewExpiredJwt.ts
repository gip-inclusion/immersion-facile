import { decode, TokenExpiredError } from "jsonwebtoken";
import {
  type AppSupportedDomainJwtPayload,
  type AppSupportedJwt,
  type ConventionId,
  type ConventionJwtPayload,
  type ConventionRole,
  errors,
  ForbiddenError,
  frontRoutes,
  type InternshipKind,
  type RenewExpiredJwtRequestDto,
  renewExpiredJwtRequestSchema,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import { verifyJwtConfig } from "../../../config/bootstrap/authMiddleware";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import {
  conventionDtoToConventionReadDto,
  conventionEmailsByRole,
} from "../../../utils/convention";
import { makeEmailHash } from "../../../utils/jwt";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class RenewExpiredJwt extends TransactionalUseCase<
  RenewExpiredJwtRequestDto,
  void
> {
  protected inputSchema = renewExpiredJwtRequestSchema;

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
    { expiredJwt, originalUrl }: RenewExpiredJwtRequestDto,
    uow: UnitOfWork,
  ) {
    const appSupportedJwtPayload = extractConventionJwtPayloadFromExpiredJwt(
      this.#config,
      expiredJwt,
    );

    if (!("applicationId" in appSupportedJwtPayload))
      throw errors.user.unsupportedJwtPayload();

    const convention = await uow.conventionRepository.getById(
      appSupportedJwtPayload.applicationId,
    );
    if (!convention)
      throw errors.convention.notFound({
        conventionId: appSupportedJwtPayload.applicationId,
      });

    const conventionRead = await conventionDtoToConventionReadDto(
      convention,
      uow,
    );

    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const emails = conventionEmailsByRole(conventionRead)(
      appSupportedJwtPayload.role,
    );

    // Only renew the link if the email hash matches
    await this.#onEmails(
      emails,
      appSupportedJwtPayload.emailHash,
      appSupportedJwtPayload.applicationId,
      appSupportedJwtPayload.role,
      this.#findRouteToRenew(originalUrl),
      uow,
      convention.internshipKind,
    );
  }

  async #onEmails(
    emails: string[],
    emailHash: string | undefined,
    conventionId: ConventionId,
    role: ConventionRole,
    route: string,
    uow: UnitOfWork,
    internshipKind: InternshipKind,
  ) {
    let foundHit = false;
    for (const email of emails) {
      if (!emailHash || makeEmailHash(email) === emailHash) {
        foundHit = true;

        const makeMagicShortLink = prepareConventionMagicShortLinkMaker({
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
      frontRoutes.assessmentDocument,
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

const extractConventionJwtPayloadFromExpiredJwt = (
  config: AppConfig,
  expiredJwt: AppSupportedJwt,
): AppSupportedDomainJwtPayload => {
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
