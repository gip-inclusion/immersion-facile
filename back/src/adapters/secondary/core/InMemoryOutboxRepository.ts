import {
  DomainEvent,
  eventsToDebugInfo,
} from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { createLogger } from "../../../utils/logger";
import { eventToDebugInfo } from "../../../domain/core/eventBus/events";
import { EditFormEstablishementPayload } from "../../../shared/tokens/MagicLinkPayload";

const logger = createLogger(__filename);

export class InMemoryOutboxRepository implements OutboxRepository {
  constructor(private readonly _events: DomainEvent[] = []) {}

  public async save(event: DomainEvent): Promise<void> {
    this._events.push(event);
    logger.info(
      { newEvent: event, newOutboxSize: this._events.length },
      "save",
    );
  }

  public async getAllUnpublishedEvents() {
    logger.debug(
      { allEvents: eventsToDebugInfo(this._events) },
      "getAllUnpublishedEvents",
    );
    const unpublishedEvents = this._events.filter(
      ({ wasPublished, wasQuarantined }) => !wasPublished && !wasQuarantined,
    );

    if (unpublishedEvents.length > 0) {
      logger.info(
        { events: eventsToDebugInfo(unpublishedEvents) },
        "getAllUnpublishedEvents: found unpublished events",
      );
    }
    return unpublishedEvents;
  }

  public async markEventsAsPublished(events: DomainEvent[]) {
    logger.debug(
      { events: eventsToDebugInfo(events) },
      "markEventsAsPublished",
    );
    events.forEach((event) => {
      const eventToUpdate = this._events.find(
        (storedEvent) => storedEvent.id === event.id,
      );
      if (eventToUpdate) {
        eventToUpdate.wasPublished = true;
        logger.info(
          { event: eventToDebugInfo(eventToUpdate) },
          "event marked as published",
        );
      }
    });
  }
  public async getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
    siret: string,
  ): Promise<EditFormEstablishementPayload | undefined> {
    return this._events.find((event) => {
      if (event.topic !== "FormEstablishmentEditLinkSent") return false;
      const payload = event.payload as EditFormEstablishementPayload;
      return payload.siret === siret;
    })?.payload as EditFormEstablishementPayload;
  }

  //test purposes
  get events() {
    return this._events;
  }
}
