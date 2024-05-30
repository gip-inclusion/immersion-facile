import { DomainEvent } from "./events";

export const makeTestDomainEvent = (
  domainEvent: Pick<DomainEvent, "payload" | "topic"> & Partial<DomainEvent>,
): DomainEvent => ({
  id: "",
  occurredAt: "",
  publications: [],
  status: "never-published",
  wasQuarantined: false,
  ...domainEvent,
});
