import type { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { ImmersionApplicationRequiresModificationPayload } from "../../immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import type { DateStr } from "../ports/Clock";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  wasPublished?: boolean;
};

export type DomainEvent =
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationSubmittedByBeneficiary", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationAcceptedByCounsellor", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationAcceptedByValidator", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"FinalImmersionApplicationValidationByAdmin", ImmersionApplicationDto>
  | GenericEvent<"ImmersionApplicationRejected", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationRequiresModification", ImmersionApplicationRequiresModificationPayload>
  | GenericEvent<"FormEstablishmentAdded", FormEstablishmentDto>;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = (event: DomainEvent) => ({
  event: event.id,
  topic: event.topic,
  wasPublished: event.wasPublished,
});
export const eventsToDebugInfo = (events: DomainEvent[]) =>
  events.map(eventToDebugInfo);
