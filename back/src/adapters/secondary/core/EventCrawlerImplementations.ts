import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { eventsToDebugInfo } from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { logger } from "../../../utils/logger";

export class BasicEventCrawler {
  protected readonly logger = logger.child({ logsource: "BasicEventCrawler" });

  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  startCrawler() {
    this.logger.warn(
      "BasicEventCrawler.startCrawler: NO AUTOMATIC EVENT PROCESSING!",
    );
  }

  public async processEvents() {
    const events = await this.outboxRepository.getAllUnpublishedEvents();
    this.logger.debug({ events: eventsToDebugInfo(events) }, "processEvents");
    events.forEach((event) => {
      this.eventBus.publish(event);
    });
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
    this.logger.info(
      { crawlingPeriodMs: this.crawlingPeriodMs },
      "RealEventCrawler.startCrawler: processing events at regular intervals",
    );
    setInterval(() => this.processEvents(), this.crawlingPeriodMs);
  }
}
