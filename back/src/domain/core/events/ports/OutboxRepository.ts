import { DomainEvent } from "../events";

export interface OutboxRepository {
  save: (event: DomainEvent) => Promise<void>;
  markEventsAsInProcess: (events: DomainEvent[]) => Promise<void>;
}
