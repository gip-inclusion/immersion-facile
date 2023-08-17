import { values } from "ramda";
import {
  AgencyDto,
  ConventionDto,
  ConventionJwtPayload,
  conventionSchema,
  filterNotFalsy,
  frontRoutes,
  Signatory,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { ShortLinkIdGeneratorGateway } from "../../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../../core/ShortLink";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { retrieveConventionWithAgency } from "../../entities/Convention";

export const NO_JUSTIFICATION = "Aucune justification trouvée.";

export class NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification extends TransactionalUseCase<ConventionDto> {
  protected inputSchema = conventionSchema;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #config: AppConfig;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    timeGateway: TimeGateway,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    config: AppConfig,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
  ) {
    super(uowPerformer);

    this.#config = config;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    conventionPayload: ConventionDto,
    uow: UnitOfWork,
    _jwtPayload?: ConventionJwtPayload | undefined,
  ): Promise<void> {
    const { agency, convention } = await retrieveConventionWithAgency(
      uow,
      conventionPayload,
    );
    await Promise.all(
      values(convention.signatories)
        .filter(filterNotFalsy)
        .map(async (signatory) =>
          this.#saveNotificationAndRelatedEvent(uow, {
            kind: "email",
            templatedContent: await this.#makeEmail(
              signatory,
              convention,
              agency,
              uow,
            ),
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
            },
          }),
        ),
    );
  }

  async #makeEmail(
    signatory: Signatory,
    convention: ConventionDto,
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail> {
    return {
      kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
      recipients: [signatory.email],
      params: {
        agencyLogoUrl: agency.logoUrl,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        businessName: convention.businessName,
        conventionId: convention.id,
        conventionSignShortlink: await prepareMagicShortLinkMaker({
          conventionMagicLinkPayload: {
            id: convention.id,
            role: signatory.role,
            email: signatory.email,
            now: this.#timeGateway.now(),
          },
          uow,
          config: this.#config,
          generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
        })(frontRoutes.conventionToSign),
        justification: convention.statusJustification ?? NO_JUSTIFICATION,
        signatoryFirstName: signatory.firstName,
        signatoryLastName: signatory.lastName,
        internshipKind: convention.internshipKind,
      },
    };
  }
}
