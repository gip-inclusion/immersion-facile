import { DomainEvent } from "../eventBus/events";

export interface OutboxQueries {
  getAllUnpublishedEvents: () => Promise<DomainEvent[]>;
  getAllFailedEvents: () => Promise<DomainEvent[]>;
}
