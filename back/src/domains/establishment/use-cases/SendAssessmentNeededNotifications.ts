import subDays from "date-fns/subDays";
import { partition, uniqBy } from "ramda";
import {
  type AbsoluteUrl,
  type AgencyWithUsersRights,
  assessmentEmailSender,
  type ConventionDto,
  type ConventionId,
  castError,
  type DateRange,
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
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { useCaseBuilder } from "../../core/useCaseBuilder";

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

export type SendAssessmentNeededNotifications = ReturnType<
  typeof makeSendAssessmentNeededNotifications
>;

type Deps = {
  createNewEvent: CreateNewEvent;
  outOfTransaction: OutOfTransaction;
  uowPerformer: UnitOfWorkPerformer;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;
  shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;
  timeGateway: TimeGateway;
  config: AppConfig;
};

export const makeSendAssessmentNeededNotifications = useCaseBuilder(
  "SendAssessmentNeededNotifications",
)
  .notTransactional()
  .withInput<SendAssessmentParams>(
    z.object({
      conventionEndDate: withDateRangeSchema,
    }),
  )
  .withOutput<SendAssessmentNeededNotificationsOutput>()
  .withDeps<Deps>()
  .build(async ({ inputParams, deps }) => {
    const {
      conventionsQtyWithImmersionEnding,
      conventionsQtyWithAlreadyExistingAssessment,
      conventionsThatDontHaveAssessment,
    } = await getConventionsToSendEmailTo(deps, inputParams);

    const results = await executeInSequence(
      conventionsThatDontHaveAssessment,
      (convention) =>
        deps.uowPerformer
          // each transaction could fail here without impacting others
          .perform((uow) => sendAssessmentNotifications(uow, deps, convention))
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
  });

const getConventionsToSendEmailTo = async (
  deps: Deps,
  params: SendAssessmentParams,
): Promise<{
  conventionsQtyWithImmersionEnding: number;
  conventionsThatDontHaveAssessment: ConventionDto[];
  conventionsQtyWithAlreadyExistingAssessment: number;
}> => {
  const conventionsEndingInRange =
    await deps.outOfTransaction.conventionQueries.getConventions({
      filters: {
        endDate: params.conventionEndDate,
        withStatuses: validatedConventionStatuses,
      },
      sortBy: "dateStart",
    });

  const conventionsUpdatedInRangeAndEndingUpToRange =
    await deps.outOfTransaction.conventionQueries.getConventions({
      filters: {
        endDate: {
          to: params.conventionEndDate.to,
        },
        updateDate: {
          from: subDays(params.conventionEndDate.from, 2),
          to: params.conventionEndDate.to,
        },
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
    await deps.outOfTransaction.assessmentRepository
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

  return {
    conventionsQtyWithImmersionEnding:
      conventionsThatRequireAnAssessment.length,
    conventionsQtyWithAlreadyExistingAssessment:
      conventionIdsWithAlreadyExistingAssessment.length,
    conventionsThatDontHaveAssessment,
  };
};

const sendAssessmentNotifications = async (
  uow: UnitOfWork,
  deps: Deps,
  convention: ConventionDto,
): Promise<{ id: ConventionId }> => {
  const agency = await uow.agencyRepository.getById(convention.agencyId);
  if (!agency) throw errors.agency.notFound({ agencyId: convention.agencyId });

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
            makeTutorAssessmentNotification(
              convention,
              agency,
              await prepareConventionMagicShortLinkMaker({
                config: deps.config,
                conventionMagicLinkPayload: {
                  id: convention.id,
                  email: convention.establishmentTutor.email,
                  role: "establishment-tutor",
                  now: deps.timeGateway.now(),
                },
                generateConventionMagicLinkUrl:
                  deps.generateConventionMagicLinkUrl,
                shortLinkIdGeneratorGateway: deps.shortLinkIdGeneratorGateway,
                uow,
              })({
                targetRoute: frontRoutes.assessment,
                lifetime: "short",
                singleUse: false,
              }),
            ),
          ]
        : []),
      ...(isBeneficiaryNotificationNotSent
        ? [makeBeneficiaryNotification(convention)]
        : []),
    ].map((notif) => deps.saveNotificationAndRelatedEvent(uow, notif)),
  );

  await Promise.all([
    ...(isTutorNotificationNotSent
      ? [
          uow.outboxRepository.save(
            deps.createNewEvent({
              topic: "EmailWithLinkToCreateAssessmentSent",
              payload: { id: convention.id },
            }),
          ),
        ]
      : []),
    ...(isBeneficiaryNotificationNotSent
      ? [
          uow.outboxRepository.save(
            deps.createNewEvent({
              topic: "BeneficiaryAssessmentEmailSent",
              payload: { id: convention.id },
            }),
          ),
        ]
      : []),
  ]);

  return { id: convention.id };
};

const makeBeneficiaryNotification = (
  convention: ConventionDto,
): NotificationContentAndFollowedIds => ({
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

const makeTutorAssessmentNotification = (
  convention: ConventionDto,
  agency: AgencyWithUsersRights,
  assessmentCreationLink: AbsoluteUrl,
): NotificationContentAndFollowedIds => ({
  kind: "email",
  templatedContent: {
    kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
    recipients: [convention.establishmentTutor.email],
    sender: assessmentEmailSender,
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
});
