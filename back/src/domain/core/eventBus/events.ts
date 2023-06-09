import {
  AgencyDto,
  AgencyId,
  AuthenticatedUserId,
  ContactEstablishmentRequestDto,
  ConventionDto,
  EstablishmentJwtPayload,
  Flavor,
  FormEstablishmentDto,
  IcUserRoleForAgencyParams,
  ImmersionAssessmentDto,
  WithConventionId,
} from "shared";
import { RenewMagicLinkPayload } from "../../convention/useCases/notifications/DeliverRenewedMagicLink";
import { ConventionRequiresModificationPayload } from "../../convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { WithNotificationIdAndKind } from "../../generic/notifications/entities/Notification";
import { IdentityProvider } from "../../generic/OAuth/entities/OngoingOAuth";
import { EstablishmentAggregate } from "../../immersionOffer/entities/EstablishmentEntity";
import { ConventionReminderPayload } from "../eventsPayloads/ConventionReminderPayload";
import type { DateStr } from "../ports/TimeGateway";

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

export type NotificationAddedEvent = GenericEvent<
  "NotificationAdded",
  WithNotificationIdAndKind
>;

// prettier-ignore
export type DomainEvent =
  | NotificationAddedEvent
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  | GenericEvent<"ImmersionApplicationSubmittedByBeneficiary", ConventionDto>
  | GenericEvent<"ConventionSubmittedAfterModification", ConventionDto>
  | GenericEvent<"ImmersionApplicationPartiallySigned", ConventionDto>
  | GenericEvent<"ImmersionApplicationFullySigned", ConventionDto>
  | GenericEvent<"ImmersionApplicationAcceptedByCounsellor", ConventionDto>
  | GenericEvent<"ImmersionApplicationAcceptedByValidator", ConventionDto>
  | GenericEvent<"ConventionReminderRequired", ConventionReminderPayload>

  // UNHAPPY PATHS
  | GenericEvent<"ImmersionApplicationRejected", ConventionDto>
  | GenericEvent<"ImmersionApplicationCancelled", ConventionDto>
  | GenericEvent<"ImmersionApplicationRequiresModification", ConventionRequiresModificationPayload>
  | GenericEvent<"ConventionDeprecated", ConventionDto>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", FormEstablishmentDto>
  | GenericEvent<"FormEstablishmentEdited", FormEstablishmentDto>
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentRequestDto>
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload>
  | GenericEvent<"NewEstablishmentAggregateInsertedFromForm", EstablishmentAggregate>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", AgencyDto>
  | GenericEvent<"AgencyActivated", { agency: AgencyDto }>
  | GenericEvent<"AgencyUpdated", { agency: AgencyDto }>

  // IMMERSION ASSESSMENT related
  | GenericEvent<"ImmersionAssessmentCreated", ImmersionAssessmentDto>
  | GenericEvent<"EmailWithLinkToCreateAssessmentSent", WithConventionId>

  // PECONNECT related
  | GenericEvent<"FederatedIdentityBoundToConvention", ConventionDto>
  | GenericEvent<"FederatedIdentityNotBoundToConvention", ConventionDto>
  // USER CONNECTED related (only inclusion connect for now).
  // We don't put full OAuth in payload to avoid private data in logs etc...
  | GenericEvent<"UserAuthenticatedSuccessfully", { userId: string, provider: IdentityProvider }>
  | GenericEvent<"AgencyRegisteredToInclusionConnectedUser", { userId: AuthenticatedUserId, agencyIds: AgencyId[] }>
  | GenericEvent<"IcUserAgencyRightChanged", IcUserRoleForAgencyParams>;

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
