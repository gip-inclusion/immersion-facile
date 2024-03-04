import { DomainEvent } from "../events";

export interface OutboxQueries {
  getAllUnpublishedEvents: (params: { limit: number }) => Promise<
    DomainEvent[]
  >;
  getFailedEvents: (params: { limit: number }) => Promise<DomainEvent[]>;
}
