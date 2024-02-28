import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../../../domains/core/events/adapters/EventCrawlerImplementations";
import { EventBus } from "../../../domains/core/events/ports/EventBus";
import { EventCrawler } from "../../../domains/core/events/ports/EventCrawler";
import { UnitOfWorkPerformer } from "../../../domains/core/unit-of-work/ports/UnitOfWorkPerformer";
import { AppConfig } from "./appConfig";

export const createEventCrawler = (
  config: AppConfig,
  uowPerformer: UnitOfWorkPerformer,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(uowPerformer, eventBus, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(uowPerformer, eventBus);
