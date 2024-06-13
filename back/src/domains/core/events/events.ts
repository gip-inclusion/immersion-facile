import {
  AgencyId,
  ContactEstablishmentEventPayload,
  ConventionId,
  DateString,
  EstablishmentJwtPayload,
  ExtractFromExisting,
  Flavor,
  IcUserRoleForAgencyParams,
  RejectIcUserRoleForAgencyParams,
  Role,
  SiretDto,
  UserId,
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
export type NotificationBatchAddedEvent = GenericEvent<
  "NotificationBatchAdded",
  WithNotificationIdAndKind[]
>;

export type UserAuthenticatedPayload = {
  userId: string;
  provider: IdentityProvider;
  codeSafir: string | null;
};

export type TriggeredBy =
  | { kind: "inclusion-connected"; userId: UserId }
  | { kind: "convention-magic-link"; role: Role }
  | { kind: "establishment-magic-link"; siret: SiretDto };

export type WithTriggeredBy = {
  triggeredBy: TriggeredBy | undefined;
};

// biome-ignore format: better readability without formatting
export type DomainEvent =
  | NotificationAddedEvent
  | NotificationBatchAddedEvent
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  | GenericEvent<"ConventionSubmittedByBeneficiary", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionSubmittedAfterModification", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionPartiallySigned", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionFullySigned", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionAcceptedByCounsellor", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionAcceptedByValidator", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionReminderRequired", ConventionReminderPayload>

  // UNHAPPY PATHS
  | GenericEvent<"ConventionRejected", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionCancelled", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionRequiresModification", ConventionRequiresModificationPayload & WithTriggeredBy>
  | GenericEvent<"ConventionDeprecated", WithConventionDto & WithTriggeredBy>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload & WithTriggeredBy>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", WithFormEstablishmentDto & WithTriggeredBy>
  | GenericEvent<"FormEstablishmentEdited", WithFormEstablishmentDto & WithTriggeredBy>
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentEventPayload & WithTriggeredBy>
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload & WithTriggeredBy>
  | GenericEvent<"NewEstablishmentAggregateInsertedFromForm", WithEstablishmentAggregate & WithTriggeredBy>

  // ESTABLISHMENT LEAD RELATED
  | GenericEvent<"EstablishmentLeadReminderSent", WithConventionIdLegacy>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", WithAgencyDto & WithTriggeredBy>
  | GenericEvent<"AgencyActivated", WithAgencyDto & WithTriggeredBy>
  | GenericEvent<"AgencyUpdated", WithAgencyDto & WithTriggeredBy>
  | GenericEvent<"AgencyRejected", WithAgencyDto & WithTriggeredBy>

  // IMMERSION ASSESSMENT related
  | GenericEvent<"AssessmentCreated", WithAssessmentDto>
  | GenericEvent<"EmailWithLinkToCreateAssessmentSent", WithConventionIdLegacy>
  | GenericEvent<"BeneficiaryAssessmentEmailSent", WithConventionIdLegacy>

  // PECONNECT related
  | GenericEvent<"FederatedIdentityBoundToConvention", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"FederatedIdentityNotBoundToConvention", WithConventionDto & WithTriggeredBy>
  // USER CONNECTED related (only inclusion connect for now).
  // We don't put full OAuth in payload to avoid private data in logs etc...
  | GenericEvent<"UserAuthenticatedSuccessfully", UserAuthenticatedPayload>
  | GenericEvent<"AgencyRegisteredToInclusionConnectedUser", { userId: UserId; agencyIds: AgencyId[] } & WithTriggeredBy>
  | GenericEvent<"IcUserAgencyRightChanged", IcUserRoleForAgencyParams & WithTriggeredBy>
  | GenericEvent<"IcUserAgencyRightRejected", RejectIcUserRoleForAgencyParams & WithTriggeredBy>
  // API CONSUMER related
  | GenericEvent<"ApiConsumerSaved", { consumerId: string }>
  // ERRORED CONVENTION RELATED
  | GenericEvent<"PartnerErroredConventionMarkedAsHandled", { conventionId: ConventionId; userId: UserId }>;

export type DomainTopic = DomainEvent["topic"];

export type AssessmentEmailDomainTopic = ExtractFromExisting<
  DomainTopic,
  "EmailWithLinkToCreateAssessmentSent" | "BeneficiaryAssessmentEmailSent"
>;
