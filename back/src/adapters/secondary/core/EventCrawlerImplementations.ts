import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { eventsToDebugInfo } from "../../../domain/core/eventBus/events";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";

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
    //eslint-disable-next-line no-console
    console.time("__metrics : getAllUnpublishedEvents query duration");
    const events = await this.uowPerformer.perform((uow) =>
      uow.outboxQueries.getAllUnpublishedEvents(),
    );
    //eslint-disable-next-line no-console
    console.timeEnd("__metrics : getAllUnpublishedEvents query duration");
    logger.debug(
      { events: eventsToDebugInfo(events) },
      "processing new Events",
    );
    await Promise.all(events.map((event) => this.eventBus.publish(event)));
  }

  public async retryFailedEvents() {
    //eslint-disable-next-line no-console
    console.time("__metrics : getAllFailedEvents query duration");
    const events = await this.uowPerformer.perform((uow) =>
      uow.outboxQueries.getAllFailedEvents(),
    );
    //eslint-disable-next-line no-console
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
