import { addMonths, startOfDay, subDays } from "date-fns";
import {
  type AgencyId,
  type AgencyWithUsersRights,
  castError,
  type DelegationConventionReminderKind,
  type EmailType,
  executeInSequence,
  isTruthy,
} from "shared";
import type { DomainEvent } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type DelegationConventionReminder = ReturnType<
  typeof makeDelegationConventionReminder
>;

type EventWithAgencyId = {
  id: AgencyId;
  event: DomainEvent;
};

export const makeDelegationConventionReminder = useCaseBuilder(
  "DelegationConventionReminder",
)
  .withOutput<{
    success: number;
    failures: { id: AgencyId; error: Error }[];
  }>()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
  }>()
  .build(async ({ uow, deps }) => {
    const today = startOfDay(deps.timeGateway.now());

    const agenciesToRemindThreeMonthsBefore =
      await getAgenciesNeedingDelegationConventionReminder({
        uow,
        delegationConventionEndDate: addMonths(today, 3),
        reminderKind: "threeMonthsBefore",
      });

    const agenciesToRemindOneMonthBefore =
      await getAgenciesNeedingDelegationConventionReminder({
        uow,
        delegationConventionEndDate: addMonths(today, 1),
        reminderKind: "oneMonthBefore",
      });

    const agenciesToRemindDayAfterExpiry =
      await getAgenciesNeedingDelegationConventionReminder({
        uow,
        delegationConventionEndDate: subDays(today, 1),
        reminderKind: "dayAfterExpiry",
      });

    const events: EventWithAgencyId[] = [
      ...agenciesToRemindThreeMonthsBefore.map(({ id }) => ({
        id,
        event: deps.createNewEvent({
          topic: "DelegationConventionReminderRequired",
          payload: {
            agencyId: id,
            reminderKind: "threeMonthsBefore",
          },
        }),
      })),
      ...agenciesToRemindOneMonthBefore.map(({ id }) => ({
        id,
        event: deps.createNewEvent({
          topic: "DelegationConventionReminderRequired",
          payload: {
            agencyId: id,
            reminderKind: "oneMonthBefore",
          },
        }),
      })),
      ...agenciesToRemindDayAfterExpiry.map(({ id }) => ({
        id,
        event: deps.createNewEvent({
          topic: "DelegationConventionReminderRequired",
          payload: {
            agencyId: id,
            reminderKind: "dayAfterExpiry",
          },
        }),
      })),
    ];

    const results: { id: AgencyId; error?: Error }[] = await executeInSequence(
      events,
      ({ event, id }) =>
        uow.outboxRepository
          .save(event)
          .then(() => ({ id }))
          .catch((error) => ({ id, error: castError(error) })),
    );

    return {
      success: results.filter(
        (result): result is { id: AgencyId } => result.error === undefined,
      ).length,
      failures: results.filter(
        (result): result is { id: AgencyId; error: Error } =>
          result.error instanceof Error,
      ),
    };
  });

const getAgenciesNeedingDelegationConventionReminder = async ({
  uow,
  delegationConventionEndDate,
  reminderKind,
}: {
  uow: UnitOfWork;
  delegationConventionEndDate: Date;
  reminderKind: DelegationConventionReminderKind;
}): Promise<AgencyWithUsersRights[]> => {
  const agencies = await getActiveAutreAgenciesWithDelegationEndingOn({
    uow,
    delegationConventionEndDate,
  });

  const emailType = getEmailTypeForDelegationConventionReminder(reminderKind);

  const agenciesNeedingReminderResults = await executeInSequence(
    agencies,
    async (agency): Promise<AgencyWithUsersRights | null> => {
      const alreadySent = await hasDelegationConventionReminderAlreadyBeenSent({
        notificationRepository: uow.notificationRepository,
        agencyId: agency.id,
        emailType,
        reminderKind,
      });
      return alreadySent ? null : agency;
    },
  );

  return agenciesNeedingReminderResults.filter(isTruthy);
};

const getActiveAutreAgenciesWithDelegationEndingOn = async ({
  uow,
  delegationConventionEndDate,
}: {
  uow: UnitOfWork;
  delegationConventionEndDate: Date;
}) => {
  const { data } = await uow.agencyRepository.getAgencies({
    filters: {
      kinds: ["autre"],
      status: ["active"],
      delegationConventionEndDate: delegationConventionEndDate.toISOString(),
    },
  });
  return data;
};

const getEmailTypeForDelegationConventionReminder = (
  reminderKind: DelegationConventionReminderKind,
): EmailType =>
  reminderKind === "dayAfterExpiry"
    ? "AGENCY_DELEGATION_CONVENTION_EXPIRED"
    : "AGENCY_DELEGATION_CONVENTION_EXPIRING_SOON";

const hasDelegationConventionReminderAlreadyBeenSent = async ({
  notificationRepository,
  agencyId,
  emailType,
  reminderKind,
}: {
  notificationRepository: NotificationRepository;
  agencyId: AgencyId;
  emailType: EmailType;
  reminderKind: DelegationConventionReminderKind;
}): Promise<boolean> => {
  const emails = await notificationRepository.getEmailsByFilters({
    agencyId,
    emailType,
  });

  if (emails.length === 0) return false;

  if (emailType !== "AGENCY_DELEGATION_CONVENTION_EXPIRING_SOON") return true;

  return emails.some(
    (email) =>
      "reminderKind" in email.templatedContent.params &&
      email.templatedContent.params.reminderKind === reminderKind,
  );
};
