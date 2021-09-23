import { eventToDebugInfo } from "./../../domain/core/eventBus/events";
import { EventCallback, EventBus } from "../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../domain/core/eventBus/events";
import { logger } from "../../utils/logger";

export class InMemoryEventBus implements EventBus {
  public subscriptions: Partial<
    Record<DomainTopic, EventCallback<DomainTopic>[]>
  >;

  private readonly logger = logger.child({
    logsource: "InMemoryEventBus",
  });

  constructor() {
    this.subscriptions = {};
  }

  public publish(event: DomainEvent) {
    this.logger.info({ event }, "publish");
    const callbacks = this.subscriptions[event.topic];
    if (callbacks === undefined) {
      this.logger.info(
        { eventTopic: event.topic },
        "No Callbacks exist for topic.",
      );
      return;
    }

    callbacks.forEach((cb) => {
      cb(event);
      this.logger.info(
        { demandeImmersionId: event.payload.id, eventId: event.id },
        `XXXXXXXXXXXXXXXX  Sending an event`,
      );
    });
  }

  public subscribe<T extends DomainTopic>(
    domainTopic: T,
    callback: EventCallback<T>,
  ) {
    this.logger.info({ domainTopic }, "subscribe");
    if (!this.subscriptions[domainTopic]) {
      this.subscriptions[domainTopic] = [];
    }

    if (callback) {
      this.subscriptions[domainTopic]!.push(callback as any);
    }
  }
}
