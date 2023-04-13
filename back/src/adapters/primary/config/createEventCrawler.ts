import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { UnitOfWorkPerformer } from "../../../domain/core/ports/UnitOfWork";
import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../../secondary/core/EventCrawlerImplementations";
import { AppConfig } from "./appConfig";

export const createEventCrawler = (
  config: AppConfig,
  uowPerformer: UnitOfWorkPerformer,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(uowPerformer, eventBus, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(uowPerformer, eventBus);
