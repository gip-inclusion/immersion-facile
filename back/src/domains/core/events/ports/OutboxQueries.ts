import { DomainEvent } from "../events";

export interface OutboxQueries {
  getAllUnpublishedEvents: (params: { limit: number }) => Promise<
    DomainEvent[]
  >;
  getAllFailedEvents: (params: { limit: number }) => Promise<DomainEvent[]>;
}
