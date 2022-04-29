import { values } from "ramda";
import {
  DomainEvent,
  eventsToDebugInfo,
} from "../../../domain/core/eventBus/events";
import { OutboxQueries } from "../../../domain/core/ports/OutboxQueries";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { InMemoryOutboxRepository } from "./InMemoryOutboxRepository";

const logger = createLogger(__filename);

export class InMemoryOutboxQueries implements OutboxQueries {
  constructor(private readonly repository: InMemoryOutboxRepository) {}

  public async getAllUnpublishedEvents() {
    const allEvents = values(this.repository._events);
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
    const allEvents = values(this.repository._events);
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
    return values(this.repository._events).find((event) => {
      if (event.topic !== "FormEstablishmentEditLinkSent") return false;
      const payload = event.payload as EstablishmentJwtPayload;
      return payload.siret === siret;
    })?.payload as EstablishmentJwtPayload;
  }
}
