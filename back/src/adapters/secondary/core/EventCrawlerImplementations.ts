import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { logger } from "../../../utils/logger";

export class BasicEventCrawler {
  private readonly logger = logger.child({ logsource: "BasicEventCrawler" });

  constructor(
    private readonly eventBus: EventBus,
    private readonly outboxRepository: OutboxRepository
  ) {}

  startCrawler() {
    logger.info(
      "Crawler is in Basic mode and will not process events until explicitly told to"
    );
  }

  public async processEvents() {
    const events = await this.outboxRepository.getAllUnpublishedEvents();
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
    private readonly crawlingPeriod: number = 10_000
  ) {
    super(eventBus, outboxRepository);
  }

  public override startCrawler() {
    setInterval(() => this.processEvents(), this.crawlingPeriod);
  }
}
