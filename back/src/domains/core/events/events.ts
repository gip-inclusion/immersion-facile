import {
  AgencyId,
  AuthenticatedUserId,
  ContactEstablishmentEventPayload,
  ConventionId,
  DateString,
  EstablishmentJwtPayload,
  ExtractFromExisting,
  Flavor,
  IcUserRoleForAgencyParams,
  RejectIcUserRoleForAgencyParams,
  WithAgencyDto,
  WithAssessmentDto,
  WithConventionDto,
  WithConventionIdLegacy,
  WithFormEstablishmentDto,
} from "shared";
import { RenewMagicLinkPayload } from "../../convention/use-cases/notifications/DeliverRenewedMagicLink";
import { WithEstablishmentAggregate } from "../../establishment/entities/EstablishmentEntity";
import { IdentityProvider } from "../authentication/inclusion-connect/entities/OngoingOAuth";
import { WithNotificationIdAndKind } from "../notifications/helpers/Notification";
import {
  ConventionReminderPayload,
  ConventionRequiresModificationPayload,
} from "./eventPayload.dto";

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
  | "in-process"
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

export type UserAuthenticatedPayload = {
  userId: string;
  provider: IdentityProvider;
  codeSafir: string | null;
};

// prettier-ignore
export type DomainEvent =
  | NotificationAddedEvent
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  | GenericEvent<"ConventionSubmittedByBeneficiary", WithConventionDto>
  | GenericEvent<"ConventionSubmittedAfterModification", WithConventionDto>
  | GenericEvent<"ConventionPartiallySigned", WithConventionDto>
  | GenericEvent<"ConventionFullySigned", WithConventionDto>
  | GenericEvent<"ConventionAcceptedByCounsellor", WithConventionDto>
  | GenericEvent<"ConventionAcceptedByValidator", WithConventionDto>
  | GenericEvent<"ConventionReminderRequired", ConventionReminderPayload>

  // UNHAPPY PATHS
  | GenericEvent<"ConventionRejected", WithConventionDto>
  | GenericEvent<"ConventionCancelled", WithConventionDto>
  | GenericEvent<
      "ConventionRequiresModification",
      ConventionRequiresModificationPayload
    >
  | GenericEvent<"ConventionDeprecated", WithConventionDto>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", WithFormEstablishmentDto>
  | GenericEvent<"FormEstablishmentEdited", WithFormEstablishmentDto>
  | GenericEvent<
      "ContactRequestedByBeneficiary",
      ContactEstablishmentEventPayload
    >
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload>
  | GenericEvent<
      "NewEstablishmentAggregateInsertedFromForm",
      WithEstablishmentAggregate
    >

  // ESTABLISHMENT LEAD RELATED
  | GenericEvent<"EstablishmentLeadReminderSent", WithConventionIdLegacy>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", WithAgencyDto>
  | GenericEvent<"AgencyActivated", WithAgencyDto>
  | GenericEvent<"AgencyUpdated", WithAgencyDto>
  | GenericEvent<"AgencyRejected", WithAgencyDto>

  // IMMERSION ASSESSMENT related
  | GenericEvent<"AssessmentCreated", WithAssessmentDto>
  | GenericEvent<"EmailWithLinkToCreateAssessmentSent", WithConventionIdLegacy>
  | GenericEvent<"BeneficiaryAssessmentEmailSent", WithConventionIdLegacy>

  // PECONNECT related
  | GenericEvent<"FederatedIdentityBoundToConvention", WithConventionDto>
  | GenericEvent<"FederatedIdentityNotBoundToConvention", WithConventionDto>
  // USER CONNECTED related (only inclusion connect for now).
  // We don't put full OAuth in payload to avoid private data in logs etc...
  | GenericEvent<"UserAuthenticatedSuccessfully", UserAuthenticatedPayload>
  | GenericEvent<
      "AgencyRegisteredToInclusionConnectedUser",
      { userId: AuthenticatedUserId; agencyIds: AgencyId[] }
    >
  | GenericEvent<"IcUserAgencyRightChanged", IcUserRoleForAgencyParams>
  | GenericEvent<"IcUserAgencyRightRejected", RejectIcUserRoleForAgencyParams>
  // API CONSUMER related
  | GenericEvent<"ApiConsumerSaved", { consumerId: string }>
  // ERRORED CONVENTION RELATED
  | GenericEvent<
      "PartnerErroredConventionMarkedAsHandled",
      { conventionId: ConventionId; userId: AuthenticatedUserId }
    >;

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
