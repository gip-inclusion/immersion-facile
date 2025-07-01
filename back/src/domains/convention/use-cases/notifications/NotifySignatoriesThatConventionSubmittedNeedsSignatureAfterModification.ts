import { values } from "ramda";
import {
  type AgencyWithUsersRights,
  type ConventionDto,
  type ConventionJwtPayload,
  filterNotFalsy,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  type Signatory,
  type TemplatedEmail,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { retrieveConventionWithAgency } from "../../entities/Convention";

export const NO_JUSTIFICATION = "Aucune justification trouvée.";

export class NotifySignatoriesThatConventionSubmittedNeedsSignatureAfterModification extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

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
    { convention }: WithConventionDto,
    uow: UnitOfWork,
    _jwtPayload?: ConventionJwtPayload | undefined,
  ): Promise<void> {
    const { agency, convention: conventionReadDto } =
      await retrieveConventionWithAgency(uow, convention.id);
    await Promise.all(
      values(conventionReadDto.signatories)
        .filter(filterNotFalsy)
        .filter((signatory) => !signatory.signedAt)
        .map(async (signatory) =>
          this.#saveNotificationAndRelatedEvent(uow, {
            kind: "email",
            templatedContent: await this.#makeEmail(
              signatory,
              conventionReadDto,
              agency,
              uow,
            ),
            followedIds: {
              conventionId: conventionReadDto.id,
              agencyId: conventionReadDto.agencyId,
              establishmentSiret: conventionReadDto.siret,
            },
          }),
        ),
    );
  }

  async #makeEmail(
    signatory: Signatory,
    convention: ConventionDto,
    agency: AgencyWithUsersRights,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail> {
    return {
      kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE_AFTER_MODIFICATION",
      recipients: [signatory.email],
      params: {
        agencyLogoUrl: agency.logoUrl ?? undefined,
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname: convention.signatories.beneficiary.firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname: convention.signatories.beneficiary.lastName,
        }),
        businessName: convention.businessName,
        conventionId: convention.id,
        conventionSignShortlink: await prepareConventionMagicShortLinkMaker({
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
        })({
          targetRoute: frontRoutes.conventionToSign,
          lifetime: "short",
          extraQueryParams: {
            mtm_source: "email-signature-link-after-modification",
          },
        }),
        justification: convention.statusJustification ?? NO_JUSTIFICATION,
        signatoryFirstName: getFormattedFirstnameAndLastname({
          firstname: signatory.firstName,
        }),
        signatoryLastName: getFormattedFirstnameAndLastname({
          lastname: signatory.lastName,
        }),
        internshipKind: convention.internshipKind,
      },
    };
  }
}
