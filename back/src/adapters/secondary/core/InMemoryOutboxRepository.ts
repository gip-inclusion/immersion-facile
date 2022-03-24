import { values } from "ramda";
import {
  DomainEvent,
  eventsToDebugInfo,
} from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { EstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryOutboxRepository implements OutboxRepository {
  constructor(private readonly _events: Record<string, DomainEvent> = {}) {}

  public async save(event: DomainEvent): Promise<void> {
    this._events[event.id] = event;
    logger.info(
      { newEvent: event, newOutboxSize: this._events.length },
      "save",
    );
  }

  public async getAllUnpublishedEvents() {
    const allEvents = values(this._events);
    logger.debug(
      { allEvents: eventsToDebugInfo(allEvents) },
      "getAllUnpublishedEvents",
    );
    const unpublishedEvents = allEvents.filter(
      (event) => !event.wasQuarantined && event.publications.length === 0,
    );

    if (unpublishedEvents.length > 0) {
      logger.info(
        { events: eventsToDebugInfo(unpublishedEvents) },
        "getAllUnpublishedEvents: found unpublished events",
      );
    }
    return unpublishedEvents;
  }

  public async getAllFailedEvents(): Promise<DomainEvent[]> {
    const allEvents = values(this._events);
    logger.debug(
      { allEvents: eventsToDebugInfo(allEvents) },
      "getAllFailedEvents",
    );

    return allEvents.filter((event) => {
      const lastPublication = event.publications[event.publications.length - 1];
      if (!lastPublication) return false;
      return lastPublication.failures.length > 0;
    });
  }
  public async getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
    siret: string,
  ): Promise<EstablishmentJwtPayload | undefined> {
    return values(this._events).find((event) => {
      if (event.topic !== "FormEstablishmentEditLinkSent") return false;
      const payload = event.payload as EstablishmentJwtPayload;
      return payload.siret === siret;
    })?.payload as EstablishmentJwtPayload;
  }

  //test purposes
  get events(): DomainEvent[] {
    return values(this._events);
  }
}
