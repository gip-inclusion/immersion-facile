import { addDays } from "date-fns";
import { z } from "zod";
import {
  castError,
  ConventionDto,
  ConventionId,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

type SendBeneficiaryAssessmentEmailsOutput = {
  errors?: Record<ConventionId, Error>;
  numberOfImmersionEndingTomorrow: number;
};

export class SendBeneficiariesAssessmentsEmails extends TransactionalUseCase<
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
      await uow.conventionQueries.getAllConventionsForThoseEndingThatDidntGoThroughSendingTopic(
        tomorrow,
        "BeneficiaryAssessmentEmailSent",
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
          agencyAssessmentDocumentLink: agency.questionnaireUrl,
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
