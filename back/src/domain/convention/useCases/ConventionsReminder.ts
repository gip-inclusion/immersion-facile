import { addBusinessDays, differenceInBusinessDays, subDays } from "date-fns";
import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  castError,
  promiseAllByBatch,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { ReminderKind } from "../../core/eventsPayloads/ConventionReminderPayload";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";

const agencyStatuses: ConventionStatus[] = ["IN_REVIEW"];
const signatoryStatuses: ConventionStatus[] = [
  "PARTIALLY_SIGNED",
  "READY_TO_SIGN",
];

const ZERO_DAYS = 0;
const ONE_DAY = 1;
const TWO_DAYS = 2;
const THREE_DAYS = 3;

type ConventionsReminderSummary = {
  success: number;
  failures: {
    id: ConventionId;
    error: Error;
  }[];
};
type EventWithConventionId = {
  id: ConventionId;
  event: DomainEvent;
};

export class ConventionsReminder extends TransactionalUseCase<
  void,
  ConventionsReminderSummary
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
  ): Promise<ConventionsReminderSummary> {
    const now = this.#timeGateway.now();
    const [
      conventionsForLastSignatoryReminder,
      conventionsForAgencyReminders,
      conventionsForFirstSignatoryReminder,
    ] = await Promise.all([
      uow.conventionQueries.getConventionsByFilters({
        startDateGreater: now,
        startDateLessOrEqual: addBusinessDays(now, TWO_DAYS),
        withStatuses: signatoryStatuses,
      }),
      uow.conventionQueries.getConventionsByFilters({
        startDateGreater: now,
        startDateLessOrEqual: addBusinessDays(now, THREE_DAYS),
        withStatuses: agencyStatuses,
      }),
      uow.conventionQueries.getConventionsByFilters({
        dateSubmissionEqual: subDays(now, TWO_DAYS),
        withStatuses: [...signatoryStatuses],
      }),
    ]);

    const events = [
      ...conventionsForLastSignatoryReminder.map(({ id }) =>
        this.#makeConventionReminderRequiredEvent(
          id,
          "LastReminderForSignatories",
        ),
      ),
      ...conventionsForAgencyReminders.flatMap((c) =>
        this.#makeAgencyReminders(c),
      ),
      ...conventionsForFirstSignatoryReminder.map(({ id }) =>
        this.#makeConventionReminderRequiredEvent(
          id,
          "FirstReminderForSignatories",
        ),
      ),
    ];

    const results: { id: ConventionId; error?: Error }[] =
      await promiseAllByBatch(100, events, ({ event, id }) => {
        return uow.outboxRepository
          .save(event)
          .then(() => ({ id }))
          .catch((error) => ({ id, error: castError(error) }));
      });

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
