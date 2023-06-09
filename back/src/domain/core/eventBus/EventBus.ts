import { DateStr } from "shared";
import { TimeGateway } from "../ports/TimeGateway";
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
  timeGateway: TimeGateway;
  uuidGenerator: UuidGenerator;
  quarantinedTopics?: DomainTopic[];
};

export type CreateNewEvent = <T extends DomainTopic>(params: {
  topic: T;
  payload: NarrowEvent<T>["payload"];
  occurredAt?: DateStr;
  wasQuarantined?: boolean;
  publications?: EventPublication[];
}) => NarrowEvent<T>;

export const makeCreateNewEvent = ({
  uuidGenerator,
  timeGateway,
  quarantinedTopics = [],
}: CreateEventDependencies): CreateNewEvent => {
  const quarantinedTopicSet = new Set(quarantinedTopics);
  return (params: any) => ({
    id: uuidGenerator.new(),
    occurredAt: timeGateway.now().toISOString(),
    wasQuarantined: quarantinedTopicSet.has(params.topic),
    publications: [],
    ...params,
  });
};
