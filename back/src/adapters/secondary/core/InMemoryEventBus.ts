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
import { TimeGateway, DateStr } from "../../../domain/core/ports/TimeGateway";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);

type SubscriptionsForTopic = Record<string, EventCallback<DomainTopic>>;

export class InMemoryEventBus implements EventBus {
  public subscriptions: Partial<Record<DomainTopic, SubscriptionsForTopic>>;

  constructor(
    private timeGateway: TimeGateway,
    private uowPerformer: UnitOfWorkPerformer,
  ) {
    this.subscriptions = {};
  }

  public async publish(event: DomainEvent) {
    const publishedAt = this.timeGateway.now().toISOString();
    const publishedEvent = await this._publish(event, publishedAt);
    logger.info(
      {
        eventId: publishedEvent.id,
        topic: publishedEvent.topic,
        occurredAt: publishedEvent.occurredAt,
        publicationsBefore: event.publications,
        publicationsAfter: publishedEvent.publications,
      },
      "Saving published event",
    );
    await this.uowPerformer.perform((uow) =>
      uow.outboxRepository.save(publishedEvent),
    );
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

  private async _publish(
    event: DomainEvent,
    publishedAt: DateStr,
  ): Promise<DomainEvent> {
    // the publication happens here, an event is expected in return,
    // with the publication added to the event
    logger.info({ event }, "publish");

    const topic = event.topic;
    counterPublishedEventsTotal.inc({ topic });

    const callbacksById: SubscriptionsForTopic | undefined =
      this.subscriptions[topic];

    if (isUndefined(callbacksById))
      return publishEventWithNoCallbacks(event, publishedAt);

    const failuresOrUndefined: (EventFailure | void)[] = await Promise.all(
      getSubscriptionIdsToPublish(event, callbacksById).map(
        makeExecuteCbMatchingSubscriptionId(event, callbacksById),
      ),
    );

    const failures: EventFailure[] = failuresOrUndefined.filter(isEventFailure);

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
      const message = "Failed too many times, event will be Quarantined";
      logger.error({ event }, message);
      const { payload, publications, ...restEvent } = event;
      notifyObjectDiscord({
        event: {
          ...restEvent,
          lastPublication: publications.at(-1),
        },
        message,
      });
    }

    return {
      ...event,
      publications,
      wasQuarantined,
    };
  }
}

const isUndefined = (
  callbacksById: SubscriptionsForTopic | undefined,
): callbacksById is undefined => callbacksById === undefined;

const publishEventWithNoCallbacks = (
  event: DomainEvent,
  publishedAt: DateStr,
): DomainEvent => {
  monitorAbsenceOfCallback(event);

  return {
    ...event,
    publications: [...event.publications, { publishedAt, failures: [] }],
  };
};

const makeExecuteCbMatchingSubscriptionId =
  (event: DomainEvent, callbacksById: SubscriptionsForTopic) =>
  async (subscriptionId: SubscriptionId): Promise<void | EventFailure> => {
    const cb = callbacksById[subscriptionId];
    logger.info(
      { eventId: event.id, topic: event.topic },
      `Sending an event for ${subscriptionId}`,
    );

    try {
      await cb(event);
    } catch (error: any) {
      monitorErrorInCallback(error, event);
      return { subscriptionId, errorMessage: error.message };
    }
  };

const isEventFailure = (
  failure: EventFailure | void,
): failure is EventFailure => !!failure;

const getSubscriptionIdsToPublish = (
  event: DomainEvent,
  callbacksById: SubscriptionsForTopic,
): SubscriptionId[] => {
  const lastPublication = event.publications.at(-1);
  return lastPublication
    ? lastPublication.failures.map(prop("subscriptionId"))
    : keys(callbacksById);
};

const monitorAbsenceOfCallback = (event: DomainEvent) => {
  logger.warn({ eventTopic: event.topic }, "No Callbacks exist for topic.");
};

const monitorErrorInCallback = (error: any, event: DomainEvent) => {
  logger.error(
    { event, error: error.message || JSON.stringify(error) },
    "Error when publishing event",
  );
  counterPublishedEventsError.inc({
    topic: event.topic,
    errorType: "callback_failed",
  });
};

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
