import { EventCallback, EventBus } from "../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../domain/core/eventBus/events";

class InMemoryEventBus implements EventBus {
  private subscriptions: Partial<
    Record<DomainTopic, EventCallback<DomainTopic>[]>
  >;

  constructor() {
    this.subscriptions = {};
  }

  public publish(event: DomainEvent) {
    const callbacks = this.subscriptions[event.topic];
    if (callbacks === undefined) {
      console.log(`Topic ${event.topic} does not exist`);
      return;
    }
    callbacks.forEach((cb) => cb(event));
  }

  public subscribe<T extends DomainTopic>(
    domainTopic: T,
    callback: EventCallback<T>
  ) {
    const topic = this.subscriptions[domainTopic];
    if (!topic) this.subscriptions[domainTopic] = [];

    this.subscriptions[domainTopic]!.push(callback as any);
  }
}
