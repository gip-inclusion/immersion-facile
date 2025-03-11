import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../../domains/core/events/adapters/EventCrawlerImplementations";
import type { EventBus } from "../../domains/core/events/ports/EventBus";
import type { EventCrawler } from "../../domains/core/events/ports/EventCrawler";
import type { UnitOfWorkPerformer } from "../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";
import type { AppConfig } from "./appConfig";

export const createEventCrawler = (
  config: AppConfig,
  uowPerformer: UnitOfWorkPerformer,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(uowPerformer, eventBus, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(uowPerformer, eventBus);
