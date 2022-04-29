import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { eventsToDebugInfo } from "../../../domain/core/eventBus/events";
import { OutboxQueries } from "../../../domain/core/ports/OutboxQueries";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);
export class BasicEventCrawler implements EventCrawler {
  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxQueries: OutboxQueries,
  ) {}

  startCrawler() {
    logger.warn(
      "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    );
  }

  public async processNewEvents() {
    console.time("__metrics : getAllUnpublishedEvents query duration");
    const events = await this.outboxQueries.getAllUnpublishedEvents();
    console.timeEnd("__metrics : getAllUnpublishedEvents query duration");
    logger.debug(
      { events: eventsToDebugInfo(events) },
      "processing new Events",
    );
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }

  public async retryFailedEvents() {
    console.time("__metrics : getAllFailedEvents query duration");
    const events = await this.outboxQueries.getAllFailedEvents();
    console.timeEnd("__metrics : getAllFailedEvents query duration");
    logger.debug({ events: eventsToDebugInfo(events) }, "retrying Events");
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }
}

const retryErrorsPeriodMs = 90_000;

export class RealEventCrawler
  extends BasicEventCrawler
  implements EventCrawler
{
  constructor(
    eventBus: EventBus,
    outboxQueries: OutboxQueries,
    private readonly crawlingPeriodMs: number = 10_000,
  ) {
    super(eventBus, outboxQueries);
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
