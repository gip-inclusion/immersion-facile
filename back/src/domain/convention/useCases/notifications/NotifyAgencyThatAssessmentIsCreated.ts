import { WithAssessmentDto, withAssessmentSchema } from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../../core/UseCase";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

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
      throw new NotFoundError(
        `Unable to send mail. No convention were found with id : ${assessment.conventionId}`,
      );

    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency)
      throw new NotFoundError(
        `Unable to send mail. No agency were found with id : ${convention.agencyId}`,
      );

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "NEW_ASSESSMENT_CREATED_AGENCY_NOTIFICATION",
        recipients: [agency.validatorEmails[0]],
        params: {
          agencyValidatorEmail: agency.validatorEmails[0],
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          businessName: convention.businessName,
          conventionId: convention.id,
          dateEnd: convention.dateEnd,
          dateStart: convention.dateStart,
          establishmentFeedback: assessment.establishmentFeedback,
          assessmentStatus: assessment.status,
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
  }
}
