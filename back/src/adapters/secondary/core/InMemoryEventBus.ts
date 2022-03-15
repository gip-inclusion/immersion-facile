import promClient from "prom-client";
import {
  EventBus,
  EventCallback,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../../domain/core/eventBus/events";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

const counterPublishedEventsTotal = new promClient.Counter({
  name: "in_memory_event_bus_published_events_total",
  help: "The total count of events published by InMemoryEventBus.",
  labelNames: ["topic"],
});

const counterPublishedEventsSuccess = new promClient.Counter({
  name: "in_memory_event_bus_published_events_success",
  help: "The success count of events published by InMemoryEventBus.",
  labelNames: ["topic"],
});

const counterPublishedEventsError = new promClient.Counter({
  name: "in_memory_event_bus_published_events_error",
  help: "The error count of events published by InMemoryEventBus.",
  labelNames: ["topic", "errorType"],
});

export class InMemoryEventBus implements EventBus {
  public subscriptions: Partial<
    Record<DomainTopic, EventCallback<DomainTopic>[]>
  >;
  constructor() {
    this.subscriptions = {};
  }

  public async publish(event: DomainEvent) {
    logger.info({ event }, "publish");

    const topic = event.topic;
    counterPublishedEventsTotal.inc({ topic });

    const callbacks = this.subscriptions[topic];
    if (callbacks === undefined) {
      logger.info({ eventTopic: event.topic }, "No Callbacks exist for topic.");
      counterPublishedEventsError.inc({
        topic,
        errorType: "no_callback_found",
      });
      return;
    }

    try {
      await Promise.all(
        callbacks.map(async (cb) => {
          logger.info(
            { eventId: event.id },
            `XXXXXXXXXXXXXXXX  Sending an event`,
          );
          await cb(event);
        }),
      );
      counterPublishedEventsSuccess.inc({ topic });
    } catch (e: any) {
      logger.error(e, "callback failed");
      counterPublishedEventsError.inc({ topic, errorType: "callback_failed" });
      throw e;
    }
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.subscriptions[domainTopic]!.push(callback as any);
    }
  }
}
