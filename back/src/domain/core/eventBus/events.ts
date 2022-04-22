import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { EstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
import { Flavor } from "../../../shared/typeFlavors";
import {
  ImmersionApplicationRequiresModificationPayload,
  RenewMagicLinkPayload,
} from "../../immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import type { DateStr } from "../ports/Clock";
import { ImmersionApplicationDto } from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { AgencyConfig } from "../../../shared/agency/agency.dto";
import { FormEstablishmentDto } from "../../../shared/formEstablishment/FormEstablishment.dto";
import { EstablishmentAggregate } from "../../immersionOffer/entities/EstablishmentEntity";

export type SubscriptionId = Flavor<string, "SubscriptionId">;

export type EventFailure = {
  subscriptionId: SubscriptionId;
  errorMessage: string;
};

export type EventPublication = {
  publishedAt: DateStr;
  failures: EventFailure[];
};

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  publications: EventPublication[];
  wasQuarantined: boolean;
};

export type DomainEvent =
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationSubmittedByBeneficiary", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationPartiallySigned", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationFullySigned", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationAcceptedByCounsellor", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationAcceptedByValidator", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"FinalImmersionApplicationValidationByAdmin", ImmersionApplicationDto>

  // UNHAPPY PATHS
  | GenericEvent<"ImmersionApplicationRejected", ImmersionApplicationDto>
  | GenericEvent<"ImmersionApplicationCancelled", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationRequiresModification", ImmersionApplicationRequiresModificationPayload>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", FormEstablishmentDto>
  | GenericEvent<"FormEstablishmentEdited", FormEstablishmentDto>
  // prettier-ignore
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentRequestDto>
  // prettier-ignore
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload>
  // prettier-ignore
  | GenericEvent<"NewEstablishmentAggregateInsertedFromForm", EstablishmentAggregate>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", AgencyConfig>;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = (event: DomainEvent) => {
  const publishCount = event.publications.length;
  const lastPublication = event.publications[publishCount - 1];

  return {
    eventId: event.id,
    topic: event.topic,
    wasQuarantined: event.wasQuarantined,
    lastPublishedAt: lastPublication?.publishedAt,
    failedSubscribers: lastPublication?.failures,
    publishCount,
  };
};
export const eventsToDebugInfo = (events: DomainEvent[]) =>
  events.map(eventToDebugInfo);
