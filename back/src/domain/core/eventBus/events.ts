import type { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { ImmersionApplicationRequiresModificationPayload } from "../../immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import type { DateStr } from "../ports/Clock";

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  wasPublished?: boolean;
};

export type DomainEvent =
  | GenericEvent<
      "ImmersionApplicationSubmittedByBeneficiary",
      ImmersionApplicationDto
    >
  | GenericEvent<
      "ImmersionApplicationAcceptedByCounsellor",
      ImmersionApplicationDto
    >
  | GenericEvent<
      "ImmersionApplicationAcceptedByValidator",
      ImmersionApplicationDto
    >
  | GenericEvent<
      "FinalImmersionApplicationValidationByAdmin",
      ImmersionApplicationDto
    >
  | GenericEvent<"ImmersionApplicationRejected", ImmersionApplicationDto>
  | GenericEvent<
      "ImmersionApplicationRequiresModification",
      ImmersionApplicationRequiresModificationPayload
    >;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = <T extends string, P>(event: DomainEvent) => ({
  event: event.id,
  topic: event.topic,
  wasPublished: event.wasPublished,
});
export const eventsToDebugInfo = <T extends string, P>(events: DomainEvent[]) =>
  events.map(eventToDebugInfo);
