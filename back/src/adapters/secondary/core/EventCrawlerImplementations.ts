import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { eventsToDebugInfo } from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);
export class BasicEventCrawler implements EventCrawler {
  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  startCrawler() {
    logger.warn(
      "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    );
  }

  public async processNewEvents() {
    const events = await this.outboxRepository.getAllUnpublishedEvents();
    logger.debug(
      { events: eventsToDebugInfo(events) },
      "processing new Events",
    );
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }

  public async retryFailedEvents() {
    const events = await this.outboxRepository.getAllFailedEvents();
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
    outboxRepository: OutboxRepository,
    private readonly crawlingPeriodMs: number = 10_000,
  ) {
    super(eventBus, outboxRepository);
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
