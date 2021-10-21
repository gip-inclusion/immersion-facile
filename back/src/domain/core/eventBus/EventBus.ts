import { Clock } from "../ports/Clock";
import { UuidGenerator } from "../ports/UuidGenerator";
import type { DomainEvent, DomainTopic } from "./events";

export type NarrowEvent<
  T extends DomainTopic,
  E extends DomainEvent = DomainEvent,
> = Extract<E, { topic: T }>;

export type EventCallback<T extends DomainTopic> = (e: NarrowEvent<T>) => void;

export interface EventBus {
  publish: (event: DomainEvent) => void;
  subscribe: <T extends DomainTopic>(
    topic: T,
    callBack: EventCallback<T>,
  ) => void;
}

type CreateEventDependencies = {
  clock: Clock;
  uuidGenerator: UuidGenerator;
};

export type CreateNewEvent = <T extends DomainTopic>(params: {
  topic: T;
  payload: NarrowEvent<T>["payload"];
}) => NarrowEvent<T>;

export const makeCreateNewEvent =
  ({ uuidGenerator, clock }: CreateEventDependencies): CreateNewEvent =>
  (params: any) => {
    return {
      id: uuidGenerator.new(),
      occurredAt: clock.now(),
      wasPublished: false,
      ...params,
    };
  };
