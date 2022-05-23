import { EventBus } from "../../../domain/core/eventBus/EventBus";
import { EventCrawler } from "../../../domain/core/eventBus/EventCrawler";
import { OutboxQueries } from "../../../domain/core/ports/OutboxQueries";
import {
  BasicEventCrawler,
  RealEventCrawler,
} from "../../secondary/core/EventCrawlerImplementations";
import { AppConfig } from "./appConfig";

export const createEventCrawler = (
  config: AppConfig,
  outboxQueries: OutboxQueries,
  eventBus: EventBus,
): EventCrawler =>
  config.eventCrawlerPeriodMs > 0
    ? new RealEventCrawler(eventBus, outboxQueries, config.eventCrawlerPeriodMs)
    : new BasicEventCrawler(eventBus, outboxQueries);
