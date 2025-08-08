import { partition, uniqBy } from "ramda";
import {
  type AbsoluteUrl,
  type AgencyDto,
  type AgencyRole,
  type AgencyWithUsersRights,
  type ConventionDto,
  type ConventionId,
  calculateDurationInSecondsFrom,
  castError,
  type DateRange,
  type Email,
  errors,
  executeInSequence,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  immersionFacileNoReplyEmailSender,
  validatedConventionStatuses,
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
  conventionsQtyWithImmersionEnding: number;
  conventionsQtyWithAlreadyExistingAssessment: number;
  conventionsQtyWithAssessmentSentSuccessfully: number;
  conventionsAssessmentSentErrored?: Record<ConventionId, Error>;
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

  readonly #outOfTransaction: OutOfTransaction;

  readonly #createNewEvent: CreateNewEvent;

  readonly #uowPerformer: UnitOfWorkPerformer;

  readonly #config: AppConfig;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    outOfTransaction: OutOfTransaction,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    createNewEvent: CreateNewEvent,
    config: AppConfig,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
  ) {
    super();
    this.#uowPerformer = uowPerformer;
    this.#outOfTransaction = outOfTransaction;
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
    const {
      conventionsQtyWithImmersionEnding,
      conventionsQtyWithAlreadyExistingAssessment,
      conventionsThatDontHaveAssessment,
    } = await this.#getConventionsToSendEmailTo(params);

    const results = await executeInSequence(
      conventionsThatDontHaveAssessment,
      (convention) =>
        this.#uowPerformer
          // each transaction could fail here without impacting others
          .perform((uow) => this.#sendAssessmentNotifications(uow, convention))
          .catch((error) => ({ id: convention.id, error: castError(error) })),
    );

    const [conventionIdsWithError, conventionIdsWithoutError] = partition(
      (result) => "error" in result,
      results,
    );

    return {
      conventionsQtyWithImmersionEnding,
      conventionsQtyWithAlreadyExistingAssessment,
      conventionsQtyWithAssessmentSentSuccessfully:
        conventionIdsWithoutError.length,
      ...(conventionIdsWithError.length
        ? {
            conventionsAssessmentSentErrored: conventionIdsWithError.reduce<
              Record<ConventionId, Error>
            >((acc, current) => {
              acc[current.id] = current.error;
              return acc;
            }, {}),
          }
        : {}),
    };
  }

  async #getConventionsToSendEmailTo(params: SendAssessmentParams): Promise<{
    conventionsQtyWithImmersionEnding: number;
    conventionsThatDontHaveAssessment: ConventionDto[];
    conventionsQtyWithAlreadyExistingAssessment: number;
  }> {
    const start = this.#timeGateway.now();

    const conventionsEndingInRange =
      await this.#outOfTransaction.conventionQueries.getConventions({
        filters: {
          endDate: params.conventionEndDate,
          withStatuses: validatedConventionStatuses,
        },
        sortBy: "dateStart",
      });
    const conventionsUpdatedInRangeAndEndingUpToRange =
      await this.#outOfTransaction.conventionQueries.getConventions({
        filters: {
          endDate: {
            to: params.conventionEndDate.to,
          },
          updateDate: params.conventionEndDate,
          withStatuses: validatedConventionStatuses,
        },
        sortBy: "dateStart",
      });

    const conventionsThatRequireAnAssessment = uniqBy(
      (c) => c.id,
      [
        ...conventionsEndingInRange,
        ...conventionsUpdatedInRangeAndEndingUpToRange,
      ],
    );

    const conventionIdsWithAlreadyExistingAssessment =
      await this.#outOfTransaction.assessmentRepository
        .getByConventionIds(
          conventionsThatRequireAnAssessment.map(({ id }) => id),
        )
        .then((assessments) =>
          assessments.map(({ conventionId }) => conventionId),
        );

    const conventionsThatDontHaveAssessment =
      conventionsThatRequireAnAssessment.filter(
        ({ id }) => !conventionIdsWithAlreadyExistingAssessment.includes(id),
      );

    logger.info({
      useCaseName: this.constructor.name,
      durationInSeconds: calculateDurationInSecondsFrom(start),
      message: `getConventionsToSendEmailTo - conventionsThatRequireAnAssessment: ${conventionsThatRequireAnAssessment.length} - conventionsThatDontHaveAssessment: ${conventionsThatDontHaveAssessment.length}`,
    });

    return {
      conventionsQtyWithImmersionEnding:
        conventionsThatRequireAnAssessment.length,
      conventionsQtyWithAlreadyExistingAssessment:
        conventionIdsWithAlreadyExistingAssessment.length,
      conventionsThatDontHaveAssessment,
    };
  }

  async #sendAssessmentNotifications(
    uow: UnitOfWork,
    convention: ConventionDto,
  ): Promise<{ id: ConventionId }> {
    const start = this.#timeGateway.now();

    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const conventionAdvisorEntity =
      await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
        convention.id,
      );

    const alreadySentNotifications =
      await uow.notificationRepository.getEmailsByFilters({
        conventionId: convention.id,
      });

    const isBeneficiaryNotificationNotSent =
      alreadySentNotifications.filter(
        ({ templatedContent }) =>
          templatedContent.kind === "ASSESSMENT_BENEFICIARY_NOTIFICATION",
      ).length === 0;

    const isTutorNotificationNotSent =
      alreadySentNotifications.filter(
        ({ templatedContent }) =>
          templatedContent.kind === "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
      ).length === 0;

    // TODO : Tentative de save les notifs en un appel db avec saveNotificationsBatchAndRelatedEvent
    // problème de test avec des notifs/event de notif existants
    await Promise.all(
      [
        ...(isTutorNotificationNotSent
          ? [
              this.#makeTutorAssessmentNotification({
                convention,
                agency,
                assessmentCreationLink:
                  await prepareConventionMagicShortLinkMaker({
                    config: this.#config,
                    conventionMagicLinkPayload: {
                      id: convention.id,
                      email: convention.establishmentTutor.email,
                      role: "establishment-tutor",
                      now: this.#timeGateway.now(),
                    },
                    generateConventionMagicLinkUrl:
                      this.#generateConventionMagicLinkUrl,
                    shortLinkIdGeneratorGateway:
                      this.#shortLinkIdGeneratorGateway,
                    uow,
                  })({
                    targetRoute: frontRoutes.assessment,
                    lifetime: "short",
                  }),
              }),
              ...(convention.internshipKind === "immersion"
                ? this.#makeAgencyAssessmentNotifications(
                    convention,
                    await agencyWithRightToAgencyDto(uow, agency),
                    conventionAdvisorEntity?.advisor?.email,
                  )
                : []),
            ]
          : []),
        ...(isBeneficiaryNotificationNotSent
          ? [this.#makeBeneficiaryNotification(convention)]
          : []),
      ].map((notif) => this.#saveNotificationAndRelatedEvent(uow, notif)),
    );

    await Promise.all([
      ...(isTutorNotificationNotSent
        ? [
            uow.outboxRepository.save(
              this.#createNewEvent({
                topic: "EmailWithLinkToCreateAssessmentSent",
                payload: { id: convention.id },
              }),
            ),
          ]
        : []),
      ...(isBeneficiaryNotificationNotSent
        ? [
            uow.outboxRepository.save(
              this.#createNewEvent({
                topic: "BeneficiaryAssessmentEmailSent",
                payload: { id: convention.id },
              }),
            ),
          ]
        : []),
    ]);

    logger.info({
      useCaseName: this.constructor.name,
      durationInSeconds: calculateDurationInSecondsFrom(start),
      message: `sendAssessmentNotifications - convention ${convention.id} - isBeneficiaryNotificationNotSent ${isBeneficiaryNotificationNotSent} - isTutorNotificationNotSent ${isTutorNotificationNotSent}`,
    });

    return { id: convention.id };
  }

  #makeBeneficiaryNotification(
    convention: ConventionDto,
  ): NotificationContentAndFollowedIds {
    return {
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
    };
  }

  #makeAgencyAssessmentNotifications(
    convention: ConventionDto,
    agency: AgencyDto,
    advisorEmail: Email | undefined,
  ): NotificationContentAndFollowedIds[] {
    const emailsToSendWithRole: { email: Email; role: AgencyRole }[] =
      advisorEmail
        ? [{ email: advisorEmail, role: "validator" }]
        : [
            ...agency.validatorEmails.map((email) => ({
              email,
              role: "validator" as const,
            })),
            ...agency.counsellorEmails.map((email) => ({
              email,
              role: "counsellor" as const,
            })),
          ];

    return emailsToSendWithRole.map(({ email, role }) => ({
      kind: "email",
      templatedContent: {
        kind: "ASSESSMENT_AGENCY_NOTIFICATION",
        recipients: [email],
        sender: immersionFacileNoReplyEmailSender,
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
      },
      followedIds: {
        agencyId: convention.agencyId,
        conventionId: convention.id,
        establishmentSiret: convention.siret,
      },
    }));
  }

  #makeTutorAssessmentNotification({
    convention,
    agency,
    assessmentCreationLink,
  }: {
    convention: ConventionDto;
    agency: AgencyWithUsersRights;
    assessmentCreationLink: AbsoluteUrl;
  }): NotificationContentAndFollowedIds {
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
