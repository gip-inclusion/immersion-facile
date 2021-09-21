import { DomainEvent } from "../eventBus/events";

export interface OutboxRepository {
  save: (event: DomainEvent) => Promise<void>;
  getAllUnpublishedEvents: () => Promise<DomainEvent[]>;
  markEventsAsPublished: (events: DomainEvent[]) => Promise<void>;
}
