import type { DomainEvent, EventStatus } from "../events";

export interface OutboxRepository {
  countAllEvents(params: { status: EventStatus }): Promise<number>;
  save: (event: DomainEvent) => Promise<void>;
  markEventsAsInProcess: (events: DomainEvent[]) => Promise<void>;
  markOldInProcessEventsAsToRepublish: ({
    eventsBeforeDate,
  }: { eventsBeforeDate: Date }) => Promise<void>;
}
