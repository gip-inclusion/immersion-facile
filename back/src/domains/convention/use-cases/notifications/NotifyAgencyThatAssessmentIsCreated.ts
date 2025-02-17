import {
  Email,
  Role,
  WithAssessmentDto,
  computeTotalHours,
  frontRoutes,
  withAssessmentSchema,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { retrieveConventionWithAgency } from "../../entities/Convention";

export class NotifyAgencyThatAssessmentIsCreated extends TransactionalUseCase<WithAssessmentDto> {
  protected inputSchema = withAssessmentSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  readonly #timeGateway: TimeGateway;
  readonly #config: AppConfig;
  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    timeGateway: TimeGateway,
    config: AppConfig,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
    this.#config = config;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
  }

  public async _execute(
    { assessment }: WithAssessmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const { agency, convention } = await retrieveConventionWithAgency(
      uow,
      assessment.conventionId,
    );

    const { validatorEmails, counsellorEmails } =
      await agencyWithRightToAgencyDto(uow, agency);

    const recipientsRoleAndEmail: { email: Email; role: Role }[] = [
      ...validatorEmails.map(
        (validatorEmail): { email: Email; role: Role } => ({
          email: validatorEmail,
          role: "validator",
        }),
      ),
      ...counsellorEmails.map(
        (counsellorEmail): { email: Email; role: Role } => ({
          email: counsellorEmail,
          role: "counsellor",
        }),
      ),
    ];

    if (assessment.status === "DID_NOT_SHOW") {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          recipients: recipientsRoleAndEmail.map(
            (recipient) => recipient.email,
          ),
          params: {
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            conventionId: convention.id,
            immersionObjective: convention.immersionObjective,
            internshipKind: convention.internshipKind,
            immersionAppellationLabel:
              convention.immersionAppellation.appellationLabel,
          },
        },
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    } else {
      const numberOfHoursMade = computeTotalHours({
        convention,
        lastDayOfPresence:
          assessment.status === "PARTIALLY_COMPLETED"
            ? assessment.lastDayOfPresence
            : "",
        numberOfMissedHours:
          assessment.status === "PARTIALLY_COMPLETED"
            ? assessment.numberOfMissedHours
            : 0,
        status: assessment.status,
      });

      for (const { email, role } of recipientsRoleAndEmail) {
        const makeShortMagicLink = prepareMagicShortLinkMaker({
          config: this.#config,
          conventionMagicLinkPayload: {
            id: convention.id,
            role,
            email,
            now: this.#timeGateway.now(),
          },
          generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
          uow,
        });
        await this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
            recipients: [email],
            cc: [convention.signatories.beneficiary.email],
            params: {
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              conventionId: convention.id,
              immersionObjective: convention.immersionObjective,
              internshipKind: convention.internshipKind,
              conventionDateEnd: convention.dateEnd,
              immersionAppellationLabel:
                convention.immersionAppellation.appellationLabel,
              assessment,
              numberOfHoursMade,
              magicLink: await makeShortMagicLink(
                frontRoutes.assessmentDocument,
              ),
            },
          },
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
          },
        });
      }
    }
  }
}
