import { values } from "ramda";
import { ConventionId } from "shared";
import { createLogger } from "../../../../utils/logger";
import { DomainEvent, EventStatus } from "../events";
import { OutboxRepository } from "../ports/OutboxRepository";

const logger = createLogger(__filename);

export class InMemoryOutboxRepository implements OutboxRepository {
  constructor(private readonly _events: Record<string, DomainEvent> = {}) {}

  public async countAllEvents({
    status,
  }: { status: EventStatus }): Promise<number> {
    return this.events.filter((event) => event.status === status).length;
  }

  //test purposes
  public get events(): DomainEvent[] {
    return values(this._events);
  }

  public async save(event: DomainEvent): Promise<void> {
    this._events[event.id] = event;
    logger.info({
      events: [event],
      message: "save",
    });
  }

  public async markEventsAsInProcess(events: DomainEvent[]): Promise<void> {
    events.forEach((event) => {
      this._events[event.id] = {
        ...event,
        status: "in-process",
      };
    });
  }

  public async getLastUnpublishedConventionBroadcastRequestedEventByConventionId(
    conventionId: ConventionId,
  ): Promise<DomainEvent | undefined> {
    const filteredEvents = values(this._events).filter(
      (event) =>
        event.topic === "ConventionBroadcastRequested" &&
        event.status !== "published" &&
        event.payload.convention.id === conventionId,
    );

    const sortedEvents = filteredEvents.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    return sortedEvents[0] || undefined;
  }
}
