import { addDays as dateFnsAddDays, format } from "date-fns";
import { EventBus } from "../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../domain/core/eventBus/events";

export const expectPromiseToFailWith = async (
  promise: Promise<unknown>,
  errorMessage: string
) => {
  await expect(promise).rejects.toThrowError(new Error(errorMessage));
};

export const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  error: Error
) => {
  await expect(promise).rejects.toThrowError(error);
};

export const addDays = (dateStr: string, amount: number) => {
  const newDate = dateFnsAddDays(new Date(dateStr), amount);
  return format(newDate, "yyyy-MM-dd");
};

export const spyOnTopic = (
  eventBus: EventBus,
  topic: DomainTopic
): DomainEvent[] => {
  const publishedEvents: DomainEvent[] = [];
  eventBus.subscribe(topic, (event) => {
    publishedEvents.push(event);
  });
  return publishedEvents;
};
