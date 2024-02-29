import { subscribeToEvents } from "../../domains/core/events/subscribeToEvents";
import { AppDependencies } from "./createAppDependencies";

export const startCrawler = (deps: AppDependencies) => {
  subscribeToEvents(deps);
  deps.eventCrawler.startCrawler();
};
