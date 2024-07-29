import {
  ConventionDto,
  ConventionId,
  DateRange,
  castError,
  immersionFacileNoReplyEmailSender,
  withDateRangeSchema,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type SendBeneficiaryAssessmentEmailsOutput = {
  errors?: Record<ConventionId, Error>;
  numberOfImmersionEndingTomorrow: number;
};

export class SendBeneficiariesPdfAssessmentsEmails extends TransactionalUseCase<
  {
    conventionEndDate?: DateRange;
  },
  SendBeneficiaryAssessmentEmailsOutput
> {
  protected inputSchema = z.object({
    conventionEndDate: withDateRangeSchema.optional(),
  });

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    params: {
      conventionEndDate: DateRange;
    },
    uow: UnitOfWork,
  ): Promise<SendBeneficiaryAssessmentEmailsOutput> {
    const conventions =
      await uow.conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
        params.conventionEndDate,
        "BENEFICIARY_ASSESSMENT_NOTIFICATION",
      );
    const errors: Record<ConventionId, Error> = {};
    await Promise.all(
      conventions.map(async (convention) => {
        await this.#sendAssessmentEmailToBeneficiary(uow, convention).catch(
          (error) => {
            errors[convention.id] = castError(error);
          },
        );
      }),
    );

    return {
      numberOfImmersionEndingTomorrow: conventions.length,
      errors,
    };
  }

  async #sendAssessmentEmailToBeneficiary(
    uow: UnitOfWork,
    convention: ConventionDto,
  ) {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw new Error(`Missing agency ${convention.agencyId} on repository.`);

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "BENEFICIARY_ASSESSMENT_NOTIFICATION",
        recipients: [convention.signatories.beneficiary.email],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          agencyValidatorEmail: agency.validatorEmails[0],
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          businessName: convention.businessName,
          conventionId: convention.id,
          agencyAssessmentDocumentLink: agency.questionnaireUrl ?? undefined,
          internshipKind: convention.internshipKind,
        },
      },
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
      },
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "BeneficiaryAssessmentEmailSent",
        payload: { id: convention.id },
      }),
    );
  }
}
