import { splitEvery } from "ramda";
import { calculateDurationInSecondsFrom } from "shared";
import {
  LoggerParamsWithMessage,
  createLogger,
} from "../../../../utils/logger";
import {
  notifyDiscord,
  notifyObjectDiscord,
} from "../../../../utils/notifyDiscord";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { DomainEvent, EventStatus } from "../events";
import { EventBus } from "../ports/EventBus";
import { EventCrawler } from "../ports/EventCrawler";

const logger = createLogger(__filename);

const maxEventsProcessedInParallel = 5;
const neverPublishedOutboxLimit = 1500;
const crawlerMaxBatchSize = 300;

export type TypeOfEvent = "unpublished" | "failed";

export class BasicEventCrawler implements EventCrawler {
  constructor(
    private uowPerformer: UnitOfWorkPerformer,
    private readonly eventBus: EventBus,
  ) {}

  protected async notifyDiscordOnTooManyOutboxWithStatus({
    status,
    limit,
  }: { status: EventStatus; limit: number }) {
    const count = await this.uowPerformer.perform((uow) =>
      uow.outboxRepository.countAllEvents({ status }),
    );
    if (count <= limit) return;
    logger.error(`${status} outbox ${count} exceeds ${limit}`);
    notifyDiscord(`${status} outbox ${count} exceeds ${limit}`);
  }

  public async processNewEvents(): Promise<void> {
    const getEventsStartDate = new Date();
    const events = await this.#retrieveEvents("unpublished");
    const retrieveEventsDurationInSeconds =
      calculateDurationInSecondsFrom(getEventsStartDate);

    const processStartDate = new Date();
    await this.#markEventsAsInProcess(events);
    await this.#publishEvents(events);
    const processEventsDurationInSeconds =
      calculateDurationInSecondsFrom(processStartDate);

    if (events.length) {
      logger.info({
        events,
        crawlerInfo: {
          numberOfEvents: events.length,
          processEventsDurationInSeconds,
          retrieveEventsDurationInSeconds,
          typeOfEvents: "unpublished",
        },
      });
    }
  }

  public async retryFailedEvents(): Promise<void> {
    const startDate = new Date();
    const events = await this.#retrieveEvents("failed");
    const retrieveEventsDurationInSeconds =
      calculateDurationInSecondsFrom(startDate);

    const processStartDate = new Date();
    // Pourquoi on ne ferait pas ici : await this.#markEventsAsInProcess(events); ???
    await this.#publishEvents(events);
    const processEventsDurationInSeconds =
      calculateDurationInSecondsFrom(processStartDate);

    if (events.length) {
      logger.warn({
        events,
        crawlerInfo: {
          numberOfEvents: events.length,
          processEventsDurationInSeconds,
          retrieveEventsDurationInSeconds,
          typeOfEvents: "failed",
        },
        message: `retryFailedEvents | ${events.length} events to process`,
      });
    }
  }

  public startCrawler() {
    logger.warn({
      message: "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    });
  }

  async #publishEvents(events: DomainEvent[]) {
    const eventGroups = splitEvery(maxEventsProcessedInParallel, events);
    for (const eventGroup of eventGroups) {
      const timer = setTimeout(() => {
        const warning = {
          message: "Processing event group is taking long",
          events: eventGroup,
        };
        notifyObjectDiscord(warning);
        logger.warn(warning);
      }, 30_000);

      await Promise.all(
        eventGroup.map((event) => this.eventBus.publish(event)),
      );

      clearTimeout(timer);
    }
  }

  async #retrieveEvents(type: TypeOfEvent): Promise<DomainEvent[]> {
    return this.uowPerformer
      .perform((uow) =>
        type === "unpublished"
          ? uow.outboxQueries.getEventsToPublish({
              limit: crawlerMaxBatchSize,
            })
          : uow.outboxQueries.getFailedEvents({ limit: crawlerMaxBatchSize }),
      )
      .catch((error) => {
        const params: LoggerParamsWithMessage = {
          error,
          message: `${this.constructor.name}.retrieveEvents failed`,
          crawlerInfo: {
            typeOfEvents: type,
          },
        };

        logger.error(params);
        notifyObjectDiscord({
          params,
        });

        return [];
      });
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
    logger.info({
      message: `RealEventCrawler.startCrawler: processing events at regular intervals (every ${this.crawlingPeriodMs}ms)`,
    });

    // old version :
    // setInterval(async () => {
    //   await this.processNewEvents();
    // }, this.crawlingPeriodMs);
    const processNewEvents = () =>
      setTimeout(() => {
        this.processNewEvents()
          .catch((error) => {
            logger.error({
              error,
              message: "RealEventCrawler.processNewEvents failed",
            });
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
            logger.error({
              error,
              message: "RealEventCrawler.retryFailedEvents failed",
            });
          })
          .finally(() => retryFailedEvents());
      }, retryErrorsPeriodMs);

    retryFailedEvents();

    this.#checkForOutboxCount();
  }

  #checkForOutboxCount() {
    setTimeout(
      () =>
        Promise.all([
          this.notifyDiscordOnTooManyOutboxWithStatus({
            status: "never-published",
            limit: neverPublishedOutboxLimit,
          }),
          this.notifyDiscordOnTooManyOutboxWithStatus({
            status: "in-process",
            limit: crawlerMaxBatchSize,
          }),
        ]).finally(() => this.#checkForOutboxCount()),
      5 * 60 * 1000, //5 min
    );
  }
}
