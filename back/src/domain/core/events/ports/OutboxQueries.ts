import { DomainEvent } from "../events";

export interface OutboxQueries {
  getAllUnpublishedEvents: () => Promise<DomainEvent[]>;
  getAllFailedEvents: () => Promise<DomainEvent[]>;
}
