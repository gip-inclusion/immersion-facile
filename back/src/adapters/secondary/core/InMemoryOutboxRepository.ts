import { eventToDebugInfo } from "./../../../domain/core/eventBus/events";
import {
  DomainEvent,
  eventsToDebugInfo,
} from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { logger } from "../../../utils/logger";

export class InMemoryOutboxRepository implements OutboxRepository {
  private readonly logger = logger.child({
    logsource: "InMemoryOutboxRepository",
  });

  constructor(private readonly _events: DomainEvent[] = []) {}

  public async save(event: DomainEvent): Promise<void> {
    this._events.push(event);
    this.logger.info(
      { newEvent: event, newOutboxSize: this._events.length },
      "save",
    );
  }

  public async getAllUnpublishedEvents() {
    this.logger.debug(
      { allEvents: eventsToDebugInfo(this._events) },
      "getAllUnpublishedEvents",
    );
    const unpublishedEvents = this._events.filter(
      ({ wasPublished }) => !wasPublished,
    );

    if (unpublishedEvents.length > 0) {
      this.logger.info(
        { events: eventsToDebugInfo(unpublishedEvents) },
        "getAllUnpublishedEvents: found unpublished events",
      );
    }
    return unpublishedEvents;
  }

  public async markEventsAsPublished(events: DomainEvent[]) {
    this.logger.debug(
      { events: eventsToDebugInfo(events) },
      "markEventsAsPublished",
    );
    events.forEach((event) => {
      const eventToUpdate = this._events.find(
        (storedEvent) => storedEvent.id === event.id,
      );
      if (eventToUpdate) {
        eventToUpdate.wasPublished = true;
        this.logger.info(
          { event: eventToDebugInfo(eventToUpdate) },
          "event marked as published",
        );
      }
    });
  }

  //test purposes
  get events() {
    return this._events;
  }
}
