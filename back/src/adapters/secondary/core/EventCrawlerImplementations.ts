import { splitEvery } from "ramda";
import { calculateDurationInSecondsFrom } from "shared";
import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import {
  DomainEvent,
  eventsToDebugInfo,
} from "../../../domain/core/eventBus/events";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);

const maxEventsProcessedInParallel = 5;

export class BasicEventCrawler implements EventCrawler {
  constructor(
    private uowPerformer: UnitOfWorkPerformer,
    private readonly eventBus: EventBus,
  ) {}

  startCrawler() {
    logger.warn(
      "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    );
  }

  public async processNewEvents(): Promise<void> {
    const events = await this.retrieveEvents("unpublished");

    if (events.length) {
      logger.info(
        { events: eventsToDebugInfo(events) },
        `processNewEvents | ${events.length} events to process`,
      );
    }

    await this.publishEvents(events);
  }

  public async retryFailedEvents(): Promise<void> {
    const events = await this.retrieveEvents("failed");
    if (events.length) {
      logger.warn(
        { events: eventsToDebugInfo(events) },
        `retryFailedEvents | ${events.length} events to process`,
      );
    }
    await this.publishEvents(events);
  }

  private async publishEvents(events: DomainEvent[]) {
    const eventGroups = splitEvery(maxEventsProcessedInParallel, events);
    for (const eventGroup of eventGroups) {
      await Promise.all(
        eventGroup.map((event) => this.eventBus.publish(event)),
      );
    }
  }

  private async retrieveEvents(
    type: "unpublished" | "failed",
  ): Promise<DomainEvent[]> {
    const startDate = new Date();
    try {
      const events = await this.uowPerformer.perform((uow) =>
        type === "unpublished"
          ? uow.outboxQueries.getAllUnpublishedEvents()
          : uow.outboxQueries.getAllFailedEvents(),
      );
      const durationInSeconds = calculateDurationInSecondsFrom(startDate);
      logger.info({
        method: "Crawler retrieveEvents",
        status: "success",
        durationInSeconds,
        typeOfEvents: type,
        numberOfEvents: events.length,
      });
      return events;
    } catch (error: any) {
      const durationInSeconds = calculateDurationInSecondsFrom(startDate);

      logger.error({
        error,
        method: "Crawler retrieveEvents",
        status: "error",
        durationInSeconds,
        typeOfEvents: type,
        errorMessage: error?.message,
      });

      notifyObjectDiscord({
        errorMessage: error?.message,
        error,
      });
      return [];
    }
  }
}

const retryErrorsPeriodMs = 90_000;

export class RealEventCrawler
  extends BasicEventCrawler
  implements EventCrawler
{
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    eventBus: EventBus,
    private readonly crawlingPeriodMs: number = 10_000,
  ) {
    super(uowPerformer, eventBus);
  }

  public override startCrawler() {
    logger.info(
      { crawlingPeriodMs: this.crawlingPeriodMs },
      "RealEventCrawler.startCrawler: processing events at regular intervals",
    );

    // old version :
    // setInterval(async () => {
    //   await this.processNewEvents();
    // }, this.crawlingPeriodMs);
    const processNewEvents = () =>
      setTimeout(() => {
        this.processNewEvents()
          .catch((error) => {
            logger.error({ error }, "RealEventCrawler.processNewEvents failed");
          })
          .finally(() => processNewEvents());
      }, this.crawlingPeriodMs);

    processNewEvents();

    // old version :
    // setInterval(async () => {
    //   await this.retryFailedEvents();
    // }, retryErrorsPeriodMs);

    const retryFailedEvents = () =>
      setTimeout(() => {
        this.retryFailedEvents()
          .catch((error) => {
            logger.error(
              { error },
              "RealEventCrawler.retryFailedEvents failed",
            );
          })
          .finally(() => retryFailedEvents());
      }, retryErrorsPeriodMs);

    retryFailedEvents();
  }
}
