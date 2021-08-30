import type { DomainEvent, DomainTopic } from "./events";

type NarrowEvent<
  T extends DomainTopic,
  E extends DomainEvent = DomainEvent
> = Extract<E, { topic: T }>;

export type EventCallback<T extends DomainTopic> = (e: NarrowEvent<T>) => void;

export interface EventBus {
  publish: (event: DomainEvent) => void;
  subscribe: <T extends DomainTopic>(
    topic: T,
    callBack: EventCallback<T>
  ) => void;
}
