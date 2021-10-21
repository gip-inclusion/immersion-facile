import { EventBus, EventCallback } from "../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../domain/core/eventBus/events";
import { createLogger } from "./../../utils/logger";

const logger = createLogger(__filename);
export class InMemoryEventBus implements EventBus {
  public subscriptions: Partial<
    Record<DomainTopic, EventCallback<DomainTopic>[]>
  >;
  constructor() {
    this.subscriptions = {};
  }

  public publish(event: DomainEvent) {
    logger.info({ event }, "publish");
    const callbacks = this.subscriptions[event.topic];
    if (callbacks === undefined) {
      logger.info({ eventTopic: event.topic }, "No Callbacks exist for topic.");
      return;
    }

    callbacks.forEach((cb) => {
      cb(event);
      logger.info({ eventId: event.id }, `XXXXXXXXXXXXXXXX  Sending an event`);
    });
  }

  public subscribe<T extends DomainTopic>(
    domainTopic: T,
    callback: EventCallback<T>,
  ) {
    logger.info({ domainTopic }, "subscribe");
    if (!this.subscriptions[domainTopic]) {
      this.subscriptions[domainTopic] = [];
    }

    if (callback) {
      this.subscriptions[domainTopic]!.push(callback as any);
    }
  }
}
