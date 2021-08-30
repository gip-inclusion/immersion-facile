type GenericEvent<T extends string, P> = {
  id: string;
  topic: T;
  payload: P;
  time: string;
};

export type DomainEvent =
  | GenericEvent<"SomethingHappended", { happended: string }>
  | GenericEvent<"SomethingElseHappended", { notHappended: number }>
  | GenericEvent<"NothingHappened", { nothingNess: Date }>;

export type DomainTopic = DomainEvent["topic"];
