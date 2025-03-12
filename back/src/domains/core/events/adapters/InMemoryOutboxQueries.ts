import { createLogger } from "../../../../utils/logger";
import type { DomainEvent } from "../events";
import type { OutboxQueries } from "../ports/OutboxQueries";
import type { InMemoryOutboxRepository } from "./InMemoryOutboxRepository";

const logger = createLogger(__filename);

export class InMemoryOutboxQueries implements OutboxQueries {
  constructor(private readonly outboxRepository: InMemoryOutboxRepository) {}

  public async getFailedEvents(): Promise<DomainEvent[]> {
    const allEvents = this.outboxRepository.events;
    logger.debug({
      events: allEvents,
      message: "getAllFailedEvents",
    });

    return allEvents.filter((event) => {
      const lastPublication = event.publications[event.publications.length - 1];
      if (!lastPublication) return false;
      return lastPublication.failures.length > 0;
    });
  }

  public async getEventsToPublish() {
    const allEvents = this.outboxRepository.events;
    logger.debug({
      events: allEvents,
      message: "getAllUnpublishedEvents",
    });

    const unpublishedEvents = allEvents.filter(
      (event) => !event.wasQuarantined && event.publications.length === 0,
    );

    if (unpublishedEvents.length > 0) {
      logger.info({
        events: unpublishedEvents,
        message: "getAllUnpublishedEvents: found unpublished events",
      });
    }
    return unpublishedEvents;
  }
}
