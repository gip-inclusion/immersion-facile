import {
  AgencyDto,
  AgencyId,
  AssessmentDto,
  AuthenticatedUserId,
  ContactEstablishmentEventPayload,
  ConventionDto,
  ConventionId,
  DateString,
  EstablishmentJwtPayload,
  ExtractFromExisting,
  Flavor,
  FormEstablishmentDto,
  IcUserRoleForAgencyParams,
  RejectIcUserRoleForAgencyParams,
  WithAgencyDto,
  WithConventionIdLegacy,
} from "shared";
import { RenewMagicLinkPayload } from "../../convention/useCases/notifications/DeliverRenewedMagicLink";
import { WithNotificationIdAndKind } from "../../generic/notifications/entities/Notification";
import { IdentityProvider } from "../../generic/OAuth/entities/OngoingOAuth";
import { EstablishmentAggregate } from "../../offer/entities/EstablishmentEntity";
import { ConventionReminderPayload } from "../eventsPayloads/ConventionReminderPayload";
import { ConventionRequiresModificationPayload } from "./eventPayload.dto";

export type SubscriptionId = Flavor<string, "SubscriptionId">;

export type EventFailure = {
  subscriptionId: SubscriptionId;
  errorMessage: string;
};

export type EventPublication = {
  publishedAt: DateString;
  failures: EventFailure[];
};

export type EventStatus =
  | "never-published"
  | "to-republish"
  | "published"
  | "failed-but-will-retry"
  | "failed-to-many-times";

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateString;
  topic: T;
  payload: P;
  publications: EventPublication[];
  wasQuarantined: boolean;
  status: EventStatus;
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
  | GenericEvent<"ConventionSubmittedByBeneficiary", ConventionDto>
  | GenericEvent<"ConventionSubmittedAfterModification", ConventionDto>
  | GenericEvent<"ConventionPartiallySigned", ConventionDto>
  | GenericEvent<"ConventionFullySigned", ConventionDto>
  | GenericEvent<"ConventionAcceptedByCounsellor", ConventionDto>
  | GenericEvent<"ConventionAcceptedByValidator", ConventionDto>
  | GenericEvent<"ConventionReminderRequired", ConventionReminderPayload>

  // UNHAPPY PATHS
  | GenericEvent<"ConventionRejected", ConventionDto>
  | GenericEvent<"ConventionCancelled", ConventionDto>
  | GenericEvent<"ConventionRequiresModification", ConventionRequiresModificationPayload>
  | GenericEvent<"ConventionDeprecated", ConventionDto>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", FormEstablishmentDto>
  | GenericEvent<"FormEstablishmentEdited", FormEstablishmentDto>
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentEventPayload>
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload>
  | GenericEvent<"NewEstablishmentAggregateInsertedFromForm", EstablishmentAggregate>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", AgencyDto>
  | GenericEvent<"AgencyActivated", WithAgencyDto>
  | GenericEvent<"AgencyUpdated", WithAgencyDto>

  // IMMERSION ASSESSMENT related
  | GenericEvent<"AssessmentCreated", AssessmentDto>
  | GenericEvent<"EmailWithLinkToCreateAssessmentSent", WithConventionIdLegacy>
  | GenericEvent<"BeneficiaryAssessmentEmailSent", WithConventionIdLegacy>

  // PECONNECT related
  | GenericEvent<"FederatedIdentityBoundToConvention", ConventionDto>
  | GenericEvent<"FederatedIdentityNotBoundToConvention", ConventionDto>
  // USER CONNECTED related (only inclusion connect for now).
  // We don't put full OAuth in payload to avoid private data in logs etc...
  | GenericEvent<"UserAuthenticatedSuccessfully", { userId: string, provider: IdentityProvider }>
  | GenericEvent<"AgencyRegisteredToInclusionConnectedUser", { userId: AuthenticatedUserId, agencyIds: AgencyId[] }>
  | GenericEvent<"IcUserAgencyRightChanged", IcUserRoleForAgencyParams>
  | GenericEvent<"IcUserAgencyRightRejected", RejectIcUserRoleForAgencyParams>
  // API CONSUMER related
  | GenericEvent<"ApiConsumerSaved", { consumerId: string }>
  // ERRORED CONVENTION RELATED
  | GenericEvent<"PartnerErroredConventionMarkedAsHandled", { conventionId: ConventionId, userId: AuthenticatedUserId }>;

export type DomainTopic = DomainEvent["topic"];

export type AssessmentEmailDomainTopic = ExtractFromExisting<
  DomainTopic,
  "EmailWithLinkToCreateAssessmentSent" | "BeneficiaryAssessmentEmailSent"
>;

const eventToDebugInfo = (event: DomainEvent) => {
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
