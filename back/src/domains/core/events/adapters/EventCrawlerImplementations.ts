import { splitEvery } from "ramda";
import { calculateDurationInSecondsFrom } from "shared";
import { createLogger } from "../../../../utils/logger";
import {
  notifyDiscord,
  notifyObjectDiscord,
} from "../../../../utils/notifyDiscord";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { DomainEvent, eventsToDebugInfo } from "../events";
import { EventBus } from "../ports/EventBus";
import { EventCrawler } from "../ports/EventCrawler";

const logger = createLogger(__filename);

const maxEventsProcessedInParallel = 5;
const neverPublishedOutboxLimit = 1500;
const crawlerMaxBatchSize = 300;

export class BasicEventCrawler implements EventCrawler {
  constructor(
    private uowPerformer: UnitOfWorkPerformer,
    private readonly eventBus: EventBus,
  ) {}

  protected async notifyDiscordOnTooManyNeverPublishedOutbox() {
    const neverPublishedCount = await this.uowPerformer.perform((uow) =>
      uow.outboxRepository.countAllEvents({ status: "never-published" }),
    );
    if (neverPublishedCount < neverPublishedOutboxLimit) return;
    logger.error(
      `"never-published" outbox ${neverPublishedCount} exceeds ${neverPublishedOutboxLimit}`,
    );
    notifyDiscord(
      `"never-published" outbox ${neverPublishedCount} exceeds ${neverPublishedOutboxLimit}`,
    );
  }

  public async processNewEvents(): Promise<void> {
    const getEventsStartDate = new Date();
    const events = await this.#retrieveEvents("unpublished");
    const getEventsDurationInSeconds =
      calculateDurationInSecondsFrom(getEventsStartDate);

    const processStartDate = new Date();
    await this.#markEventsAsInProcess(events);
    const markEventsAsInProcessDurationInSeconds =
      calculateDurationInSecondsFrom(processStartDate);
    await this.#publishEvents(events);
    const processEventsDurationInSeconds =
      calculateDurationInSecondsFrom(processStartDate);

    if (events.length) {
      logger.info({
        getEventsDurationInSeconds,
        processEventsDurationInSeconds,
        markEventsAsInProcessDurationInSeconds,
        typeOfEvents: "unpublished",
        numberOfEvent: events.length,
        events: eventsToDebugInfo(events),
      });
    }
  }

  public async retryFailedEvents(): Promise<void> {
    const startDate = new Date();
    const events = await this.#retrieveEvents("failed");
    const durationInSeconds = calculateDurationInSecondsFrom(startDate);

    if (events.length) {
      logger.warn(
        {
          durationInSeconds,
          typeOfEvents: "failed",
          numberOfEvent: events.length,
          events: eventsToDebugInfo(events),
        },
        `retryFailedEvents | ${events.length} events to process`,
      );
    }
    await this.#publishEvents(events);
  }

  public startCrawler() {
    logger.warn(
      "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    );
  }

  async #publishEvents(events: DomainEvent[]) {
    const eventGroups = splitEvery(maxEventsProcessedInParallel, events);
    for (const eventGroup of eventGroups) {
      await Promise.all(
        eventGroup.map((event) => this.eventBus.publish(event)),
      );
    }
  }

  async #retrieveEvents(
    type: "unpublished" | "failed",
  ): Promise<DomainEvent[]> {
    try {
      const events = await this.uowPerformer.perform((uow) =>
        type === "unpublished"
          ? uow.outboxQueries.getAllUnpublishedEvents({
              limit: crawlerMaxBatchSize,
            })
          : uow.outboxQueries.getFailedEvents({ limit: crawlerMaxBatchSize }),
      );
      return events;
    } catch (error: any) {
      logger.error({
        error,
        method: "Crawler retrieveEvents",
        status: "error",
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

  #markEventsAsInProcess(events: DomainEvent[]) {
    return this.uowPerformer.perform((uow) =>
      uow.outboxRepository.markEventsAsInProcess(events),
    );
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

    const checkForNeverPublishedOutboxCount = () => {
      setTimeout(
        () =>
          this.notifyDiscordOnTooManyNeverPublishedOutbox().finally(() =>
            checkForNeverPublishedOutboxCount(),
          ),
        5 * 60 * 1000, //5 min
      );
    };
    checkForNeverPublishedOutboxCount();
  }
}
