import { addMonths, startOfDay, subDays } from "date-fns";
import { type AgencyId, castError, executeInSequence } from "shared";
import type { DomainEvent } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
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
      await getActiveAutreAgenciesWithDelegationEndingOn({
        uow,
        delegationConventionEndDate: addMonths(today, 3),
      });

    const agenciesToRemindOneMonthBefore =
      await getActiveAutreAgenciesWithDelegationEndingOn({
        uow,
        delegationConventionEndDate: addMonths(today, 1),
      });

    const agenciesToRemindDayAfterExpiry =
      await getActiveAutreAgenciesWithDelegationEndingOn({
        uow,
        delegationConventionEndDate: subDays(today, 1),
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
