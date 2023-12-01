import { addBusinessDays, differenceInBusinessDays } from "date-fns";
import { z } from "zod";
import { ConventionDto, ConventionId, ConventionStatus } from "shared";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { ReminderKind } from "../../core/eventsPayloads/ConventionReminderPayload";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

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
    const supportedConventions =
      await uow.conventionQueries.getConventionsByFilters({
        startDateGreater: this.#timeGateway.now(),
        startDateLessOrEqual: addBusinessDays(this.#timeGateway.now(), 3),
        withStatuses: [...agencyStatuses, ...signatoryStatuses],
      });

    const results: { id: ConventionId; error?: Error }[] = await Promise.all(
      supportedConventions
        .flatMap((convention) =>
          this.#prepareReminderEventsByConvention(convention),
        )
        .map((eventWithConvention) =>
          uow.outboxRepository
            .save(eventWithConvention.event)
            .then(() => ({ id: eventWithConvention.id }))
            .catch((error: Error) => ({ id: eventWithConvention.id, error })),
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

  #prepareReminderEventsByConvention({
    id,
    status,
    dateStart,
  }: ConventionDto): EventWithConventionId[] {
    const dateStartDiff = differenceInBusinessDays(
      new Date(dateStart),
      this.#timeGateway.now(),
    );
    return [
      // ...(dateStartDiff > TWO_DAYS &&
      //   dateStartDiff <= THREE_DAYS &&
      //   signatoryStatuses.includes(status)
      //     ? [
      //         this.#makeConventionReminderRequiredEvent(
      //           id,
      //           "FirstReminderForSignatories",
      //         ),
      //       ]
      //     : []),
      ...(dateStartDiff > ZERO_DAYS &&
      dateStartDiff <= TWO_DAYS &&
      signatoryStatuses.includes(status)
        ? [
            this.#makeConventionReminderRequiredEvent(
              id,
              "LastReminderForSignatories",
            ),
          ]
        : []),
      ...(dateStartDiff > TWO_DAYS &&
      dateStartDiff <= THREE_DAYS &&
      agencyStatuses.includes(status)
        ? [
            this.#makeConventionReminderRequiredEvent(
              id,
              "FirstReminderForAgency",
            ),
          ]
        : []),
      ...(dateStartDiff > ZERO_DAYS &&
      dateStartDiff <= ONE_DAY &&
      agencyStatuses.includes(status)
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
