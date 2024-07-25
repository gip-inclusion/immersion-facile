import { addDays } from "date-fns";
import {
  ConventionDto,
  ConventionId,
  castError,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type SendBeneficiaryAssessmentEmailsOutput = {
  errors?: Record<ConventionId, Error>;
  numberOfImmersionEndingTomorrow: number;
};

export class SendBeneficiariesPdfAssessmentsEmails extends TransactionalUseCase<
  void,
  SendBeneficiaryAssessmentEmailsOutput
> {
  protected inputSchema = z.void();

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #createNewEvent: CreateNewEvent;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<SendBeneficiaryAssessmentEmailsOutput> {
    const now = this.#timeGateway.now();
    const tomorrow = addDays(now, 1);
    const conventions =
      await uow.conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
        {
          from: tomorrow,
          to: addDays(tomorrow, 1),
        },
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
