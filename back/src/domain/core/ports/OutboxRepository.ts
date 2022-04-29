import { DomainEvent } from "../eventBus/events";

export interface OutboxRepository {
  save: (event: DomainEvent) => Promise<void>;
}
