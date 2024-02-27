import { BasicEventCrawler } from "../domain/core/events/adapters/EventCrawlerImplementations";

export const processEventsForEmailToBeSent = async (
  eventCrawler: BasicEventCrawler,
) => {
  // 1. Process the convention workflow event
  await eventCrawler.processNewEvents();
  // 2. Process the email sending event (NotificationAdded)
  await eventCrawler.processNewEvents();
};
