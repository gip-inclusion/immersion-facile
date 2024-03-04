import { DomainEvent } from "../events";

export interface OutboxRepository {
  countAllNeverPublishedEvents(): Promise<number>;
  save: (event: DomainEvent) => Promise<void>;
  markEventsAsInProcess: (events: DomainEvent[]) => Promise<void>;
}
