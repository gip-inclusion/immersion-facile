import { addDays } from "date-fns";
import { z } from "zod";
import { ConventionDto, ConventionId, frontRoutes } from "shared";
import { GenerateConventionMagicLinkUrl } from "../../../adapters/primary/config/magicLinkUrl";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { NotificationGateway } from "../../generic/notifications/ports/NotificationGateway";

const logger = createLogger(__filename);

type SendEmailsWithAssessmentCreationLinkOutput = {
  errors?: Record<ConventionId, any>;
  numberOfImmersionEndingTomorrow: number;
};

export class SendEmailsWithAssessmentCreationLink extends TransactionalUseCase<
  void,
  SendEmailsWithAssessmentCreationLinkOutput
> {
  protected inputSchema = z.void();

  readonly #notificationGateway: NotificationGateway;

  readonly #timeGateway: TimeGateway;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    notificationGateway: NotificationGateway,
    timeGateway: TimeGateway,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#notificationGateway = notificationGateway;
    this.#timeGateway = timeGateway;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<SendEmailsWithAssessmentCreationLinkOutput> {
    const now = this.#timeGateway.now();
    const tomorrow = addDays(now, 1);
    const conventions =
      await uow.conventionQueries.getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
        tomorrow,
      );

    logger.info(
      `[${now.toISOString()}]: About to send assessment email to ${
        conventions.length
      } establishments`,
    );
    if (conventions.length === 0) return { numberOfImmersionEndingTomorrow: 0 };

    const errors: Record<ConventionId, any> = {};
    await Promise.all(
      conventions.map(async (convention) => {
        await this.#sendOneEmailWithImmersionAssessmentCreationLink(
          uow,
          convention,
        ).catch((error: any) => {
          errors[convention.id] = error;
        });
      }),
    );

    return {
      numberOfImmersionEndingTomorrow: conventions.length,
      errors,
    };
  }

  async #sendOneEmailWithImmersionAssessmentCreationLink(
    uow: UnitOfWork,
    convention: ConventionDto,
  ) {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw new Error(`Missing agency ${convention.agencyId} on repository.`);

    await this.#notificationGateway.sendEmail({
      kind: "CREATE_IMMERSION_ASSESSMENT",
      recipients: [convention.establishmentTutor.email],
      params: {
        agencyLogoUrl: agency.logoUrl,
        agencyValidatorEmail: agency.validatorEmails[0],
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        conventionId: convention.id,
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        immersionAssessmentCreationLink: this.#generateConventionMagicLinkUrl({
          id: convention.id,
          email: convention.establishmentTutor.email,
          role: "establishment",
          targetRoute: frontRoutes.immersionAssessment,
          now: this.#timeGateway.now(),
        }),
        internshipKind: convention.internshipKind,
      },
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: { id: convention.id },
      }),
    );
  }
}
