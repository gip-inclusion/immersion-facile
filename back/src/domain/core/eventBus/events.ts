import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import type { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import {
  ImmersionApplicationRequiresModificationPayload,
  RenewMagicLinkPayload,
} from "../../immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import type { DateStr } from "../ports/Clock";

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  wasPublished?: boolean;
  wasQuarantined?: boolean;
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
  | GenericEvent<"FormEstablishmentAdded", FormEstablishmentDto>
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>
  | GenericEvent<
      "EmailContactRequestedByBeneficiary",
      ContactEstablishmentRequestDto
    >
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationPartiallySigned", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationFullySigned", ImmersionApplicationDto>;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = (event: DomainEvent) => ({
  event: event.id,
  topic: event.topic,
  wasPublished: event.wasPublished,
  wasQuarantined: event.wasQuarantined,
});
export const eventsToDebugInfo = (events: DomainEvent[]) =>
  events.map(eventToDebugInfo);
