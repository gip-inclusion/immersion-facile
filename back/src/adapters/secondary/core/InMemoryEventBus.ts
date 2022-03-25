import promClient from "prom-client";
import { keys, prop } from "ramda";
import {
  EventBus,
  EventCallback,
} from "../../../domain/core/eventBus/EventBus";
import {
  DomainEvent,
  DomainTopic,
  EventFailure,
  EventPublication,
  SubscriptionId,
} from "../../../domain/core/eventBus/events";
import { Clock, DateStr } from "../../../domain/core/ports/Clock";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

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

type SubscriptionsForTopic = Record<string, EventCallback<DomainTopic>>;

export class InMemoryEventBus implements EventBus {
  public subscriptions: Partial<Record<DomainTopic, SubscriptionsForTopic>>;
  constructor(
    private clock: Clock,
    private afterPublish: (event: DomainEvent) => Promise<void>,
  ) {
    this.subscriptions = {};
  }

  public async publish(event: DomainEvent) {
    const publishedAt = this.clock.now().toISOString();
    const publishedEvent = await this._publish(event, publishedAt);
    await this.afterPublish(publishedEvent);
  }

  private async _publish(
    event: DomainEvent,
    publishedAt: DateStr,
  ): Promise<DomainEvent> {
    // the publication happens here, an event is expected in return,
    // with the publication added to the event
    logger.info({ event }, "publish");

    const topic = event.topic;
    counterPublishedEventsTotal.inc({ topic });

    const callbacksById = this.subscriptions[topic];
    if (callbacksById === undefined) {
      monitorAbsenceOfCallback(event);
      return addNewPublicationWithoutFailureToEvent(event, publishedAt);
    }

    const subscriptionsIdToPublish = getSubscriptionsIdToPublish(
      event,
      callbacksById,
    );

    if (!subscriptionsIdToPublish.length) {
      // this should not happen because the case callbacksById === undefined has been handle before
      monitorAbsenceOfSubscribers(event);
      return addNewPublicationWithoutFailureToEvent(event, publishedAt);
    }

    const failuresOrUndefined: (EventFailure | void)[] = await Promise.all(
      subscriptionsIdToPublish.map(
        async (subscriptionId): Promise<EventFailure | void> => {
          const cb = callbacksById[subscriptionId];
          logger.info(
            { eventId: event.id, topic: event.topic },
            `Sending an event`,
          );

          try {
            await cb(event);
          } catch (error: any) {
            monitorErrorInCallback(error, event);
            return { subscriptionId, errorMessage: error.message };
          }
        },
      ),
    );

    const failures = failuresOrUndefined.filter(
      (failure): failure is EventFailure => !!failure,
    );

    const publications: EventPublication[] = [
      ...event.publications,
      {
        publishedAt,
        failures,
      },
    ];

    if (failures.length === 0) {
      counterPublishedEventsSuccess.inc({ topic });
      return {
        ...event,
        publications,
      };
    }

    // Some subscribers have failed :
    const wasQuarantined = event.publications.length >= 3;
    if (wasQuarantined) {
      logger.error({ event }, "Failed to many times, event is Quarantined");
      notifyObjectDiscord(event);
    }

    return {
      ...event,
      publications,
      wasQuarantined,
    };
  }

  public subscribe<T extends DomainTopic>(
    domainTopic: T,
    subscriptionId: SubscriptionId,
    callback: EventCallback<T>,
  ) {
    logger.info({ domainTopic }, "subscribe");
    if (!this.subscriptions[domainTopic]) {
      this.subscriptions[domainTopic] = {};
    }

    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const subscriptionsForTopic: SubscriptionsForTopic = this.subscriptions[domainTopic]!;

    if (subscriptionsForTopic[subscriptionId]) {
      logger.warn(
        { domainTopic, subscriptionId },
        "Subscription with this id already exists. It will be override",
      );
    }

    if (callback) {
      subscriptionsForTopic[subscriptionId] = callback as any;
    }
  }
}

const addNewPublicationWithoutFailureToEvent = (
  event: DomainEvent,
  publishedAt: DateStr,
): DomainEvent => ({
  ...event,
  publications: [...event.publications, { publishedAt, failures: [] }],
});

const getSubscriptionsIdToPublish = (
  event: DomainEvent,
  callbacksById: SubscriptionsForTopic,
): SubscriptionId[] => {
  const lastPublication = event.publications[event.publications.length - 1];
  if (!lastPublication) return keys(callbacksById);
  return lastPublication.failures.map(prop("subscriptionId"));
};

const monitorAbsenceOfCallback = (event: DomainEvent) => {
  logger.info({ eventTopic: event.topic }, "No Callbacks exist for topic.");
  counterPublishedEventsError.inc({
    topic: event.topic,
    errorType: "no_callback_found",
  });
};

const monitorAbsenceOfSubscribers = (event: DomainEvent) => {
  logger.warn(
    { event },
    "No subscriber to publish to, event was already fully processed (should not happen)",
  );
};

const monitorErrorInCallback = (error: any, event: DomainEvent) => {
  logger.error({ error, event }, "Error when publishing event");
  counterPublishedEventsError.inc({
    topic: event.topic,
    errorType: "callback_failed",
  });
};
