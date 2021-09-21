import { DomainEvent } from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";

export class InMemoryOutboxRepository implements OutboxRepository {
  constructor(private readonly _events: DomainEvent[] = []) {}

  public async save(event: DomainEvent): Promise<void> {
    this._events.push(event);
  }

  public async getAllUnpublishedEvents() {
    return this._events.filter(({ wasPublished }) => !wasPublished);
  }

  public async markEventsAsPublished(events: DomainEvent[]) {
    events.forEach((event) => {
      const eventToUpdate = this._events.find(
        (storedEvent) => storedEvent.id === event.id
      );
      if (eventToUpdate) eventToUpdate.wasPublished = true;
    });
  }

  //test purposes
  get events() {
    return this._events;
  }
}
