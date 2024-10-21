import { WithAssessmentDto, errors, withAssessmentSchema } from "shared";
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

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "NEW_ASSESSMENT_CREATED_AGENCY_NOTIFICATION",
        recipients: [agency.validatorEmails[0]],
        params: {
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
