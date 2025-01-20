import {
  WithAssessmentDto,
  computeTotalHours,
  errors,
  withAssessmentSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyAgencyThatAssessmentIsCreated extends TransactionalUseCase<WithAssessmentDto> {
  protected inputSchema = withAssessmentSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { assessment }: WithAssessmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const convention = await uow.conventionRepository.getById(
      assessment.conventionId,
    );
    if (!convention)
      throw errors.convention.notFound({
        conventionId: assessment.conventionId,
      });

    const agencyWithRights = await uow.agencyRepository.getById(
      convention.agencyId,
    );
    if (!agencyWithRights)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

    if (assessment.status === "DID_NOT_SHOW") {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_DID_NOT_SHOW_AGENCY_NOTIFICATION",
          recipients: [...agency.counsellorEmails, ...agency.validatorEmails],
          params: {
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            conventionId: convention.id,
            immersionObjective: convention.immersionObjective,
            internshipKind: convention.internshipKind,
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
        assessmentStatus: assessment.status,
        missedHours:
          assessment.status === "PARTIALLY_COMPLETED"
            ? assessment.numberOfMissedHours
            : 0,
      });

      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ASSESSMENT_CREATED_WITH_STATUS_COMPLETED_AGENCY_NOTIFICATION",
          recipients: [...agency.counsellorEmails, ...agency.validatorEmails],
          params: {
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            conventionId: convention.id,
            immersionObjective: convention.immersionObjective,
            internshipKind: convention.internshipKind,
            conventionDateEnd: convention.dateEnd,
            assessment,
            numberOfHoursMade,
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
