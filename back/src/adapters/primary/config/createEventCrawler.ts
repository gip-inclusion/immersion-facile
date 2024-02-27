import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../../../domain/core/events/adapters/EventCrawlerImplementations";
import { EventBus } from "../../../domain/core/events/ports/EventBus";
import { EventCrawler } from "../../../domain/core/events/ports/EventCrawler";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import { AppConfig } from "./appConfig";

export const createEventCrawler = (
  config: AppConfig,
  uowPerformer: UnitOfWorkPerformer,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(uowPerformer, eventBus, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(uowPerformer, eventBus);
