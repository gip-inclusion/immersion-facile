import { AppDependencies } from "./config/createAppDependencies";
import { subscribeToEvents } from "./subscribeToEvents";

export const startCrawler = (deps: AppDependencies) => {
  subscribeToEvents(deps);
  deps.eventCrawler.startCrawler();
};
