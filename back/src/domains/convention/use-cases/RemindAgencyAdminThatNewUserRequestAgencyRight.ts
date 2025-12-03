import { addBusinessDays, differenceInBusinessDays } from "date-fns";
import {
  type ConventionDto,
  type ConventionId,
  type ConventionStatus,
  castError,
  type ReminderKind,
  type UserId,
} from "shared";
import { z } from "zod";
import type { DomainEvent } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type RemindAgencyAdminThatNewUserRequestAgencyRightSummary = {
  success: number;
  failures: {
    userId: UserId;
    error: Error;
  }[];
};
type EventWithConventionId = {
  id: ConventionId;
  event: DomainEvent;
};

export class ConventionsReminder extends TransactionalUseCase<
  void,
  RemindAgencyAdminThatNewUserRequestAgencyRightSummary
> {
  protected inputSchema = z.void();

  readonly #timeGateway: TimeGateway;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    timeGateway: TimeGateway,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#timeGateway = timeGateway;
    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<RemindAgencyAdminThatNewUserRequestAgencyRightSummary> {
    const results: { id: ConventionId; error?: Error }[] = await Promise.all(
      events.map(({ event, id }) =>
        uow.outboxRepository
          .save(event)
          .then(() => ({ id }))
          .catch((error) => ({ id, error: castError(error) })),
      ),
    );

    return {
      success: results.filter(
        (
          result,
        ): result is {
          id: ConventionId;
        } => result.error === undefined,
      ).length,
      failures: results.filter(
        (
          result,
        ): result is {
          id: ConventionId;
          error: Error;
        } => result.error instanceof Error,
      ),
    };
  }

  #makeConventionReminderRequiredEvent(
    id: ConventionId,
    reminderKind: ReminderKind,
  ): EventWithConventionId {
    return {
      id,
      event: this.#createNewEvent({
        topic: "ConventionReminderRequired",
        payload: {
          conventionId: id,
          reminderKind,
        },
      }),
    };
  }

  #makeAgencyReminders({
    id,
    status,
    dateStart,
  }: ConventionDto): EventWithConventionId[] {
    const dateStartDiff = differenceInBusinessDays(
      new Date(dateStart),
      this.#timeGateway.now(),
    );
    if (!agencyStatuses.includes(status)) return [];
    return [
      ...(TWO_DAYS < dateStartDiff && dateStartDiff <= THREE_DAYS
        ? [
            this.#makeConventionReminderRequiredEvent(
              id,
              "FirstReminderForAgency",
            ),
          ]
        : []),
      ...(ZERO_DAYS < dateStartDiff && dateStartDiff <= ONE_DAY
        ? [
            this.#makeConventionReminderRequiredEvent(
              id,
              "LastReminderForAgency",
            ),
          ]
        : []),
    ];
  }
}
