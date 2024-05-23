import * as Sentry from "@sentry/node";
import { keys, prop } from "ramda";
import { DateString } from "shared";
import {
  counterPublishedEventsError,
  counterPublishedEventsSuccess,
  counterPublishedEventsTotal,
} from "../../../../utils/counters";
import { createLogger } from "../../../../utils/logger";
import { notifyObjectDiscord } from "../../../../utils/notifyDiscord";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import {
  DomainEvent,
  DomainTopic,
  EventFailure,
  EventPublication,
  SubscriptionId,
  eventsToDebugInfo,
} from "../events";
import { EventBus, EventCallback } from "../ports/EventBus";

const logger = createLogger(__filename);

type SubscriptionsForTopic = Record<string, EventCallback<DomainTopic>>;

export class InMemoryEventBus implements EventBus {
  public subscriptions: Partial<Record<DomainTopic, SubscriptionsForTopic>>;

  constructor(
    private timeGateway: TimeGateway,
    private uowPerformer: UnitOfWorkPerformer,
    private throwOnPublishFailure = false,
  ) {
    this.subscriptions = {};
  }

  public async publish(event: DomainEvent) {
    const publishedAt = this.timeGateway.now().toISOString();
    const publishedEvent = await this.#publish(event, publishedAt);
    logger.info({
      events: eventsToDebugInfo([publishedEvent]),
      message: "Saving published event",
    });
    await this.uowPerformer.perform((uow) =>
      uow.outboxRepository.save(publishedEvent),
    );
  }

  public subscribe<T extends DomainTopic>(
    domainTopic: T,
    subscriptionId: SubscriptionId,
    callback: EventCallback<T>,
  ) {
    logger.info({ topic: domainTopic, message: "subscribe" });
    if (!this.subscriptions[domainTopic]) {
      this.subscriptions[domainTopic] = {};
    }

    const subscriptionsForTopic: SubscriptionsForTopic =
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      this.subscriptions[domainTopic]!;

    if (subscriptionsForTopic[subscriptionId]) {
      logger.warn({
        topic: domainTopic,
        subscriptionId,
        message:
          "Subscription with this id already exists. It will be override",
      });
    }

    if (callback) {
      subscriptionsForTopic[subscriptionId] = callback as any;
    }
  }

  async #publish(
    event: DomainEvent,
    publishedAt: DateString,
  ): Promise<DomainEvent> {
    // the publication happens here, an event is expected in return,
    // with the publication added to the event
    logger.info({ events: [{ eventId: event.id }], message: "publish" });

    const topic = event.topic;
    counterPublishedEventsTotal.inc({ topic });
    logger.info({ topic, message: "publishedEventsTotal" });

    const callbacksById: SubscriptionsForTopic | undefined =
      this.subscriptions[topic];

    if (!callbacksById) return publishEventWithNoCallbacks(event, publishedAt);

    const failuresOrUndefined: (EventFailure | void)[] = await Promise.all(
      getSubscriptionIdsToPublish(event, callbacksById).map(
        makeExecuteSubscriptionMatchingSubscriptionId(
          event,
          callbacksById,
          this.throwOnPublishFailure,
        ),
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
      logger.info({ topic, message: "publishedEventsSuccess" });
      return {
        ...event,
        publications,
        status: "published",
      };
    }

    // Some subscribers have failed :
    const wasMaxNumberOfErrorsReached = event.publications.length >= 3;
    if (wasMaxNumberOfErrorsReached) {
      const message = "Failed too many times, event will be Quarantined";
      logger.error({ events: [{ eventId: event.id }], message });
      const { payload: _, publications: __, ...restEvent } = event;
      notifyObjectDiscord({
        event: {
          ...restEvent,
          lastPublication: getLastPublication(event),
        },
        message,
      });
    }

    return {
      ...event,
      status: wasMaxNumberOfErrorsReached
        ? "failed-to-many-times"
        : "failed-but-will-retry",
      publications,
      wasQuarantined: wasMaxNumberOfErrorsReached,
    };
  }
}

const publishEventWithNoCallbacks = (
  event: DomainEvent,
  publishedAt: DateString,
): DomainEvent => {
  monitorAbsenceOfCallback(event);

  return {
    ...event,
    publications: [...event.publications, { publishedAt, failures: [] }],
    status: "published",
  };
};

const makeExecuteSubscriptionMatchingSubscriptionId =
  (
    event: DomainEvent,
    subscriptionsForTopic: SubscriptionsForTopic,
    throwOnPublishFailure: boolean,
  ) =>
  async (subscriptionId: SubscriptionId): Promise<void | EventFailure> => {
    const subscription = subscriptionsForTopic[subscriptionId];
    logger.info({
      events: [{ eventId: event.id }],
      topic: event.topic,
      message: `Sending an event for ${subscriptionId}`,
    });

    try {
      await subscription(event);
    } catch (error: any) {
      monitorErrorInCallback(error, event);
      if (throwOnPublishFailure) {
        throw new Error(
          [
            `Could not process event with id : ${event.id}.`,
            `Subscription ${subscriptionId} failed on topic ${event.topic}.`,
            `Error was : ${error.message}`,
          ].join("\n"),
          { cause: error },
        );
      }
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
  const lastPublication = getLastPublication(event);
  if (!lastPublication || event.status === "to-republish")
    return keys(callbacksById);

  return lastPublication.failures.map(prop("subscriptionId"));
};

const monitorAbsenceOfCallback = (event: DomainEvent) => {
  logger.warn({
    topic: event.topic,
    message: "No Callbacks exist for topic.",
  });
};

const monitorErrorInCallback = (error: any, event: DomainEvent) => {
  Sentry.captureException(error);
  counterPublishedEventsError.inc({
    topic: event.topic,
    errorType: "callback_failed",
  });
  logger.error({
    topic: event.topic,
    events: [{ eventId: event.id }],
    error: error.message || JSON.stringify(error),
    message: "publishedEventsError",
  });
};

const getLastPublication = (event: DomainEvent): EventPublication | undefined =>
  event.publications
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .at(-1);
