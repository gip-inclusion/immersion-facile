import { Clock } from "../ports/Clock";
import { UuidGenerator } from "../ports/UuidGenerator";
import type {
  DomainEvent,
  DomainTopic,
  EventPublication,
  SubscriptionId,
} from "./events";

export type NarrowEvent<
  T extends DomainTopic,
  E extends DomainEvent = DomainEvent,
> = Extract<E, { topic: T }>;

// prettier-ignore
export type EventCallback<T extends DomainTopic> = (e: NarrowEvent<T>) => Promise<void>;

export interface EventBus {
  publish: (event: DomainEvent) => Promise<void>;
  subscribe: <T extends DomainTopic>(
    topic: T,
    subscriptionId: SubscriptionId,
    callBack: EventCallback<T>,
  ) => void;
}

type CreateEventDependencies = {
  clock: Clock;
  uuidGenerator: UuidGenerator;
  quarantinedTopics?: DomainTopic[];
};

export type CreateNewEvent = <T extends DomainTopic>(params: {
  topic: T;
  payload: NarrowEvent<T>["payload"];
  wasQuarantined?: boolean;
  publications?: EventPublication[];
}) => NarrowEvent<T>;

export const makeCreateNewEvent = ({
  uuidGenerator,
  clock,
  quarantinedTopics = [],
}: CreateEventDependencies): CreateNewEvent => {
  const quarantinedTopicSet = new Set(quarantinedTopics);
  return (params: any) => ({
    id: uuidGenerator.new(),
    occurredAt: clock.now().toISOString(),
    wasQuarantined: quarantinedTopicSet.has(params.topic),
    publications: [],
    ...params,
  });
};
