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
    logger.info({ events: eventsToDebugInfo(events) }, "processNewEvents");
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }

  public async retryFailedEvents(): Promise<void> {
    const events = await this.retrieveEvents("failed");
    logger.info({ events: eventsToDebugInfo(events) }, "retryFailedEvents");
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }

  private async retrieveEvents(
    type: "unpublished" | "failed",
  ): Promise<DomainEvent[]> {
    //eslint-disable-next-line no-console
    //console.time("__metrics : getAllUnpublishedEvents query duration");
    try {
      const events = await this.uowPerformer.perform((uow) =>
        type === "unpublished"
          ? uow.outboxQueries.getAllUnpublishedEvents()
          : uow.outboxQueries.getAllFailedEvents(),
      );
      //eslint-disable-next-line no-console
      //console.timeEnd("__metrics : getAllUnpublishedEvents query duration");
      return events;
    } catch (error) {
      const message = `Event Crawler failed to process ${type} events.`;
      // eslint-disable-next-line no-console
      //console.timeEnd("__metrics : getAllUnpublishedEvents query duration");
      logger.error({ error }, message);
      notifyObjectDiscord({
        message,
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
    setInterval(async () => {
      await this.processNewEvents();
    }, this.crawlingPeriodMs);

    setInterval(async () => {
      await this.retryFailedEvents();
    }, retryErrorsPeriodMs);
  }
}
