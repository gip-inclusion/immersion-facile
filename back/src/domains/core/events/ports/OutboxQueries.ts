import { DomainEvent } from "../events";

export interface OutboxQueries {
  getEventsToPublish: (params: { limit: number }) => Promise<DomainEvent[]>;
  getFailedEvents: (params: { limit: number }) => Promise<DomainEvent[]>;
}
