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

  public async processNewEvents() {
    const events = await this.retreiveAllUnpublishedEvents();
    logger.debug(
      { events: eventsToDebugInfo(events) },
      "processing new Events",
    );
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }

  private async retreiveAllUnpublishedEvents(): Promise<DomainEvent[]> {
    //eslint-disable-next-line no-console
    //console.time("__metrics : getAllUnpublishedEvents query duration");
    try {
      const events = await this.uowPerformer.perform((uow) =>
        uow.outboxQueries.getAllUnpublishedEvents(),
      );
      //eslint-disable-next-line no-console
      //console.timeEnd("__metrics : getAllUnpublishedEvents query duration");
      return events;
    } catch (error) {
      // eslint-disable-next-line no-console
      //console.timeEnd("__metrics : getAllUnpublishedEvents query duration");
      logger.error({ error }, "Event Crawler failed to process new events");
      notifyObjectDiscord(error);
      return [];
    }
  }

  public async retryFailedEvents() {
    try {
      const events = await this.uowPerformer.perform((uow) =>
        uow.outboxQueries.getAllFailedEvents(),
      );
      logger.info({ events: eventsToDebugInfo(events) }, "retrying Events");
      await Promise.all(events.map((event) => this.eventBus.publish(event)));
    } catch (error) {
      logger.error({ error }, "Event Crawler failed to process failed events");
      notifyObjectDiscord(error);
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
