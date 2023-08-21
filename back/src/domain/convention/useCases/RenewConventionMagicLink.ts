import { decode, TokenExpiredError } from "jsonwebtoken";
import {
  AgencyDto,
  ConventionDto,
  ConventionId,
  ConventionJwtPayload,
  frontRoutes,
  InternshipKind,
  RenewMagicLinkRequestDto,
  renewMagicLinkRequestSchema,
  Role,
  stringToMd5,
} from "shared";
import { verifyJwtConfig } from "../../../adapters/primary/authMiddleware";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../adapters/primary/config/magicLinkUrl";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { ShortLinkIdGeneratorGateway } from "../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../core/ShortLink";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

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
      this.#extractValidPayload(expiredJwt),
    );

    const convention = await this.#getconvention(uow, applicationId);
    const emails = conventionEmailsByRole(
      role,
      convention,
      await this.#getAgency(uow, convention),
    )[role];
    if (emails instanceof Error) throw emails;

    const route = this.#findRouteToRenew(originalUrl);

    // Only renew the link if the email hash matches
    await this.#onEmails(
      emails,
      emailHash,
      applicationId,
      role,
      route,
      uow,
      convention.internshipKind,
    );
  }

  #extractValidPayload(expiredJwt: string) {
    const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(this.#config);
    let payloadToExtract: any | undefined;
    try {
      // If the following doesn't throw, we're dealing with a JWT that we signed, so it's
      // probably expired or an old version.
      payloadToExtract = verifyJwt(expiredJwt);
    } catch (err: any) {
      // If this JWT is signed by us but expired, deal with it.
      if (err instanceof TokenExpiredError) {
        payloadToExtract = decode(expiredJwt) as ConventionJwtPayload;
      } else {
        // Perhaps this is a JWT that is signed by a compromised key.
        try {
          verifyDeprecatedJwt(expiredJwt);
          // If the above didn't throw, this is a JWT that we issued. Renew it.
          // However, we cannot trust the contents of it, as the private key was potentially
          // compromised. Therefore, only use the application ID and the role from it, and fill
          // the remaining data from the database to prevent a hacker from getting magic links
          // for any application form.
          payloadToExtract = decode(expiredJwt);
        } catch (_) {
          // We don't want to renew this JWT.
          throw new ForbiddenError();
        }
      }
    }
    if (payloadToExtract) return payloadToExtract;
    throw new BadRequestError("Malformed expired JWT");
  }

  #findRouteToRenew(originalUrl: string) {
    const supportedRenewRoutes = [
      frontRoutes.conventionImmersionRoute,
      frontRoutes.conventionToSign,
      frontRoutes.manageConvention,
      frontRoutes.immersionAssessment,
    ];
    const routeToRenew = supportedRenewRoutes.find((supportedRoute) =>
      decodeURIComponent(originalUrl).includes(`/${supportedRoute}`),
    );
    if (routeToRenew) return routeToRenew;
    throw new BadRequestError(
      `Wrong link format, should be one of the supported route: ${supportedRenewRoutes
        .map((route) => `/${route}`)
        .join(", ")}. It was : ${originalUrl}`,
    );
  }

  async #getAgency(uow: UnitOfWork, convention: ConventionDto) {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (agency) return agency;
    logger.error(
      { agencyId: convention.agencyId },
      "No Agency Config found for this agency code",
    );
    throw new BadRequestError(convention.agencyId);
  }

  async #getconvention(uow: UnitOfWork, applicationId: ConventionId) {
    const convention = await uow.conventionRepository.getById(applicationId);
    if (convention) return convention;
    throw new NotFoundError(applicationId);
  }

  async #onEmails(
    emails: string[],
    emailHash: string | undefined,
    applicationId: ConventionId,
    role: Role,
    route: string,
    uow: UnitOfWork,
    internshipKind: InternshipKind,
  ) {
    let foundHit = false;
    for (const email of emails) {
      if (!emailHash || stringToMd5(email) === emailHash) {
        foundHit = true;

        const makeMagicShortLink = prepareMagicShortLinkMaker({
          conventionMagicLinkPayload: {
            id: applicationId,
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
              magicLink: await makeMagicShortLink(route),
              conventionStatusLink: await makeMagicShortLink(
                frontRoutes.conventionStatusDashboard,
              ),
              conventionId: applicationId,
            },
          }),
        );
      }
    }
    if (!foundHit) {
      throw new BadRequestError(
        "Le lien magique n'est plus associé à cette demande d'immersion",
      );
    }
  }
}

// Extracts the data necessary for link renewal from any version of magic link payload.
type LinkRenewData = {
  role: Role;
  applicationId: ConventionId;
  emailHash?: string;
};
const extractDataFromExpiredJwt: (payload: any) => LinkRenewData = (
  payload: any,
) =>
  !payload.version
    ? {
        role: payload.roles[0],
        applicationId: payload.applicationId,
        emailHash: undefined,
      }
    : // Once there are more JWT versions, expand this code to upgrade old JWTs, e.g.:
      // else if (payload.version === 1) {...}
      {
        role: payload.role,
        applicationId: payload.applicationId,
        emailHash: payload.emailHash,
      };

const conventionEmailsByRole = (
  role: Role,
  convention: ConventionDto,
  agency: AgencyDto,
): Record<Role, string[] | Error> => ({
  backOffice: new BadRequestError("Le backoffice n'a pas de liens magiques."),
  beneficiary: [convention.signatories.beneficiary.email],
  "beneficiary-current-employer": convention.signatories
    .beneficiaryCurrentEmployer
    ? [convention.signatories.beneficiaryCurrentEmployer.email]
    : new BadRequestError(
        "There is no beneficiaryCurrentEmployer on convention.",
      ),
  "beneficiary-representative": convention.signatories.beneficiaryRepresentative
    ? [convention.signatories.beneficiaryRepresentative.email]
    : new BadRequestError(
        "There is no beneficiaryRepresentative on convention.",
      ),
  "legal-representative": convention.signatories.beneficiaryRepresentative
    ? [convention.signatories.beneficiaryRepresentative.email]
    : new BadRequestError(
        "There is no beneficiaryRepresentative on convention.",
      ),
  counsellor: agency.counsellorEmails,
  validator: agency.validatorEmails,
  establishment: [convention.signatories.establishmentRepresentative.email],
  "establishment-representative": [
    convention.signatories.establishmentRepresentative.email,
  ],
  "establishment-tutor": new BadRequestError(
    `Le rôle ${role} n'est pas supporté pour le renouvellement de lien magique.`,
  ),
});
