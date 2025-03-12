import {
  type AgencyRole,
  type AgencyWithUsersRights,
  type ConventionDto,
  type ConventionId,
  type DateRange,
  type Email,
  castError,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
  withDateRangeSchema,
} from "shared";
import { z } from "zod";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { createLogger } from "../../../utils/logger";
import { TransactionalUseCase } from "../../core/UseCase";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

type SendAssessmentFormNotificationsOutput = {
  errors?: Record<ConventionId, Error>;
  numberOfImmersionEndingTomorrow: number;
};

export class SendAssessmentNeededNotifications extends TransactionalUseCase<
  {
    conventionEndDate?: DateRange;
  },
  SendAssessmentFormNotificationsOutput
> {
  protected inputSchema = z.object({
    conventionEndDate: withDateRangeSchema.optional(),
  });

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #timeGateway: TimeGateway;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
  }

  protected async _execute(
    params: {
      conventionEndDate: DateRange;
    },
    uow: UnitOfWork,
  ): Promise<SendAssessmentFormNotificationsOutput> {
    const now = this.#timeGateway.now();
    const conventions =
      await uow.conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
        params.conventionEndDate,
        "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      );

    logger.info({
      message: `[${now.toISOString()}]: About to send assessment email to ${
        conventions.length
      } establishments`,
    });
    if (conventions.length === 0) return { numberOfImmersionEndingTomorrow: 0 };

    const errors: Record<ConventionId, Error> = {};

    await Promise.all(
      conventions.map(async (convention) => {
        try {
          await this.#sendEmailsWithAssessmentCreationLink({ uow, convention });
          await this.#sendEmailToBeneficiary({ uow, convention });
        } catch (error) {
          errors[convention.id] = castError(error);
        }
      }),
    );

    return {
      numberOfImmersionEndingTomorrow: conventions.length,
      errors,
    };
  }

  async #sendEmailToBeneficiary({
    uow,
    convention,
  }: {
    uow: UnitOfWork;
    convention: ConventionDto;
  }) {
    const emails = await uow.notificationRepository.getLastEmailsByFilters({
      email: convention.signatories.beneficiary.email,
      emailType: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
      conventionId: convention.id,
    });
    const emailAlreadySent = emails.length > 0;

    if (emailAlreadySent) return;

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_BENEFICIARY_NOTIFICATION",
        recipients: [convention.signatories.beneficiary.email],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          businessName: convention.businessName,
          conventionId: convention.id,
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

  async #sendEmailsWithAssessmentCreationLink({
    uow,
    convention,
  }: {
    uow: UnitOfWork;
    convention: ConventionDto;
  }) {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw new Error(`Missing agency ${convention.agencyId} on repository.`);

    await this.#saveNotificationAndRelatedEvent(
      uow,
      this.#makeEstablishmentAssessmentEmail(convention, agency),
    );

    if (convention.internshipKind === "immersion")
      await this.sendEmailToAgencyUsers(uow, convention, agency);

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: { id: convention.id },
      }),
    );
  }

  private async sendEmailToAgencyUsers(
    uow: UnitOfWork,
    convention: ConventionDto,
    agency: AgencyWithUsersRights,
  ) {
    const agencyDto = await agencyWithRightToAgencyDto(uow, agency);

    const emailsToSendWithRole: { email: Email; role: AgencyRole }[] = [
      ...agencyDto.validatorEmails.map((email) => ({
        email,
        role: "validator" as const,
      })),
      ...agencyDto.counsellorEmails.map((email) => ({
        email,
        role: "counsellor" as const,
      })),
    ];

    for (const { email, role } of emailsToSendWithRole) {
      await this.#saveNotificationAndRelatedEvent(
        uow,
        this.#makeAgencyAssessmentEmail(convention, agency, email, role),
      );
    }
  }

  #makeAgencyAssessmentEmail(
    convention: ConventionDto,
    agency: AgencyWithUsersRights,
    email: Email,
    role: AgencyRole,
  ): NotificationContentAndFollowedIds {
    return {
      followedIds: {
        agencyId: convention.agencyId,
        conventionId: convention.id,
        establishmentSiret: convention.siret,
      },
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_AGENCY_NOTIFICATION",
        params: {
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          conventionId: convention.id,
          internshipKind: convention.internshipKind,
          businessName: convention.businessName,
          agencyLogoUrl: agency.logoUrl ?? undefined,
          assessmentCreationLink: this.#generateConventionMagicLinkUrl({
            id: convention.id,
            email,
            role,
            targetRoute: frontRoutes.assessment,
            now: this.#timeGateway.now(),
          }),
        },
        recipients: [email],
        sender: immersionFacileNoReplyEmailSender,
      },
    };
  }

  #makeEstablishmentAssessmentEmail(
    convention: ConventionDto,
    agency: AgencyWithUsersRights,
  ): NotificationContentAndFollowedIds {
    return {
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
        recipients: [convention.establishmentTutor.email],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          agencyLogoUrl: agency.logoUrl ?? undefined,
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          conventionId: convention.id,
          establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
          assessmentCreationLink: this.#generateConventionMagicLinkUrl({
            id: convention.id,
            email: convention.establishmentTutor.email,
            role: "establishment-tutor",
            targetRoute: frontRoutes.assessment,
            now: this.#timeGateway.now(),
          }),
          internshipKind: convention.internshipKind,
        },
      },
      followedIds: {
        conventionId: convention.id,
        agencyId: convention.agencyId,
        establishmentSiret: convention.siret,
      },
    };
  }
}
