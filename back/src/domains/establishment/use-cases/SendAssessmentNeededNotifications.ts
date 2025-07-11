import { map } from "ramda";
import {
  type AgencyRole,
  type AgencyWithUsersRights,
  type ConventionDto,
  type ConventionId,
  castError,
  type DateRange,
  type Email,
  executeInSequence,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  withDateRangeSchema,
} from "shared";
import { z } from "zod";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { createLogger } from "../../../utils/logger";
import type { AssessmentRepository } from "../../convention/ports/AssessmentRepository";
import type { ConventionQueries } from "../../convention/ports/ConventionQueries";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../core/short-link/ShortLink";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

type SendAssessmentNeededNotificationsOutput = {
  errors?: Record<ConventionId, Error>;
  numberOfImmersionEndingTomorrow: number;
  numberOfConventionsWithAlreadyExistingAssessment: number;
};

type SendAssessmentParams = {
  conventionEndDate: DateRange;
};

type OutOfTransaction = {
  conventionQueries: ConventionQueries;
  assessmentRepository: AssessmentRepository;
};

export class SendAssessmentNeededNotifications extends UseCase<
  SendAssessmentParams,
  SendAssessmentNeededNotificationsOutput
> {
  protected inputSchema = z.object({
    conventionEndDate: withDateRangeSchema,
  });

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #timeGateway: TimeGateway;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #outOfTrx: OutOfTransaction;

  readonly #createNewEvent: CreateNewEvent;

  readonly #uowPerformer: UnitOfWorkPerformer;

  readonly #config: AppConfig;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    outOfTrx: OutOfTransaction,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    createNewEvent: CreateNewEvent,
    config: AppConfig,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
  ) {
    super();
    this.#uowPerformer = uowPerformer;
    this.#outOfTrx = outOfTrx;
    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#config = config;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
  }

  protected async _execute(
    params: SendAssessmentParams,
  ): Promise<SendAssessmentNeededNotificationsOutput> {
    const errors: Record<ConventionId, Error> = {};
    const { conventions, numberOfConventionsWithAlreadyExistingAssessment } =
      await this.#getConventionsToSendEmailTo(params);

    if (conventions.length === 0)
      return {
        numberOfImmersionEndingTomorrow: 0,
        numberOfConventionsWithAlreadyExistingAssessment: 0,
      };

    await executeInSequence(conventions, (convention) =>
      this.#sendEmailsForConvention(convention, errors),
    );

    return {
      numberOfImmersionEndingTomorrow: conventions.length,
      numberOfConventionsWithAlreadyExistingAssessment,
      errors,
    };
  }

  async #sendEmailsForConvention(
    convention: ConventionDto,
    errors: Record<ConventionId, Error>,
  ) {
    await this.#uowPerformer.perform(async (uow) => {
      try {
        await this.#sendEmailsWithAssessmentCreationLink({ uow, convention });
        await this.#sendEmailToBeneficiary({ uow, convention });
      } catch (error) {
        errors[convention.id] = castError(error);
      }
    });
  }

  async #getConventionsToSendEmailTo(params: SendAssessmentParams) {
    const conventions =
      await this.#outOfTrx.conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
        params.conventionEndDate,
        "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      );

    const conventionIdsWithAlreadyExistingAssessment =
      await this.#outOfTrx.assessmentRepository
        .getByConventionIds(conventions.map((convention) => convention.id))
        .then(map(({ conventionId }) => conventionId));

    const conventionsToSendAssessmentEmailTo = conventions.filter(
      (convention) =>
        !conventionIdsWithAlreadyExistingAssessment.includes(convention.id),
    );

    logger.info({
      message: `[${this.#timeGateway.now().toISOString()}]: About to send assessment email to ${
        conventionsToSendAssessmentEmailTo.length
      } establishments`,
    });

    return {
      conventions: conventionsToSendAssessmentEmailTo,
      numberOfConventionsWithAlreadyExistingAssessment:
        conventionIdsWithAlreadyExistingAssessment.length,
    };
  }

  async #sendEmailToBeneficiary({
    uow,
    convention,
  }: {
    uow: UnitOfWork;
    convention: ConventionDto;
  }) {
    const emails = await uow.notificationRepository.getEmailsByFilters({
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
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname: convention.signatories.beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname: convention.signatories.beneficiary.lastName,
          }),
          businessName: convention.businessName,
          conventionId: convention.id,
          internshipKind: convention.internshipKind,
          establishmentTutorEmail: convention.establishmentTutor.email,
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
      await this.#makeEstablishmentAssessmentEmail({ convention, agency, uow }),
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
          agencyReferentName: getFormattedFirstnameAndLastname(
            convention.agencyReferent ?? {},
          ),
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname: convention.signatories.beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname: convention.signatories.beneficiary.lastName,
          }),
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

  async #makeEstablishmentAssessmentEmail({
    convention,
    agency,
    uow,
  }: {
    convention: ConventionDto;
    agency: AgencyWithUsersRights;
    uow: UnitOfWork;
  }): Promise<NotificationContentAndFollowedIds> {
    const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
      config: this.#config,
      conventionMagicLinkPayload: {
        id: convention.id,
        email: convention.establishmentTutor.email,
        role: "establishment-tutor",
        now: this.#timeGateway.now(),
      },
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      uow,
    });

    const assessmentCreationLink = await makeShortMagicLink({
      targetRoute: frontRoutes.assessment,
      lifetime: "short",
    });

    return {
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
        recipients: [convention.establishmentTutor.email],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          agencyLogoUrl: agency.logoUrl ?? undefined,
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname: convention.signatories.beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname: convention.signatories.beneficiary.lastName,
          }),
          conventionId: convention.id,
          establishmentTutorName: getFormattedFirstnameAndLastname({
            firstname: convention.establishmentTutor.firstName,
            lastname: convention.establishmentTutor.lastName,
          }),
          assessmentCreationLink,
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
