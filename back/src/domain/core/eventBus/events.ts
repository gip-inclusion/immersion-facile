import type { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
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
  | GenericEvent<"ImmersionApplicationRejected", ImmersionApplicationDto>;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = <T extends string, P>(
  event: GenericEvent<T, P>,
) => ({
  event: event.id,
  topic: event.topic,
  wasPublished: event.wasPublished,
});
export const eventsToDebugInfo = <T extends string, P>(
  events: GenericEvent<T, P>[],
) => events.map(eventToDebugInfo);
