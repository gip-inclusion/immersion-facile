import type { DateString } from "shared";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";
import type {
  DomainEvent,
  DomainTopic,
  EventPublication,
  EventStatus,
  SubscriptionId,
} from "../events";

export type NarrowEvent<
  T extends DomainTopic,
  E extends DomainEvent = DomainEvent,
> = Extract<E, { topic: T }>;

export type EventCallback<T extends DomainTopic> = (
  e: NarrowEvent<T>,
) => Promise<void>;

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

type CreateNewEventParams<T extends DomainTopic> = {
  topic: T;
  payload: NarrowEvent<T>["payload"];
  occurredAt?: DateString;
  wasQuarantined?: boolean;
  publications?: EventPublication[];
  status?: EventStatus;
  priority?: number;
};

export type CreateNewEvent = <T extends DomainTopic>(
  params: CreateNewEventParams<T>,
) => NarrowEvent<T>;

export const makeCreateNewEvent =
  ({
    uuidGenerator,
    timeGateway,
    quarantinedTopics = [],
  }: CreateEventDependencies): CreateNewEvent =>
  (params: any) => ({
    id: uuidGenerator.new(),
    occurredAt: timeGateway.now().toISOString(),
    wasQuarantined: new Set(quarantinedTopics).has(params.topic),
    publications: [],
    status: "never-published",
    ...params,
  });
