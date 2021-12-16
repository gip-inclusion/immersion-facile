import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { eventsToDebugInfo } from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);
export class BasicEventCrawler {
  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  startCrawler() {
    logger.warn(
      "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    );
  }

  public async processEvents() {
    const events = await this.outboxRepository.getAllUnpublishedEvents();
    logger.debug({ events: eventsToDebugInfo(events) }, "processEvents");
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
    await this.outboxRepository.markEventsAsPublished(events);
  }
}

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
    setInterval(() => this.processEvents(), this.crawlingPeriodMs);
  }
}
