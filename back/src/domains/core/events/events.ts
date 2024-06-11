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
  UserId,
  WithAgencyDto,
  WithAssessmentDto,
  WithConventionDto,
  WithConventionIdLegacy,
  WithFormEstablishmentDto,
  WithOptionalUserId,
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

type WithConventionAndOptionalUserId = WithConventionDto & WithOptionalUserId;

// biome-ignore format: better readability without formatting
export type DomainEvent =
  | NotificationAddedEvent
  | NotificationBatchAddedEvent
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  | GenericEvent<"ConventionSubmittedByBeneficiary", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionSubmittedAfterModification", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionPartiallySigned", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionFullySigned", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionAcceptedByCounsellor", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionAcceptedByValidator", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionReminderRequired", ConventionReminderPayload>

  // UNHAPPY PATHS
  | GenericEvent<"ConventionRejected", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionCancelled", WithConventionAndOptionalUserId>
  | GenericEvent<"ConventionRequiresModification", ConventionRequiresModificationPayload>
  | GenericEvent<"ConventionDeprecated", WithConventionAndOptionalUserId>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", WithFormEstablishmentDto>
  | GenericEvent<"FormEstablishmentEdited", WithFormEstablishmentDto>
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentEventPayload>
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload>
  | GenericEvent<"NewEstablishmentAggregateInsertedFromForm", WithEstablishmentAggregate>

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
  | GenericEvent<"FederatedIdentityBoundToConvention", WithConventionAndOptionalUserId>
  | GenericEvent<"FederatedIdentityNotBoundToConvention", WithConventionAndOptionalUserId>
  // USER CONNECTED related (only inclusion connect for now).
  // We don't put full OAuth in payload to avoid private data in logs etc...
  | GenericEvent<"UserAuthenticatedSuccessfully", UserAuthenticatedPayload>
  | GenericEvent<"AgencyRegisteredToInclusionConnectedUser", { userId: UserId; agencyIds: AgencyId[] }>
  | GenericEvent<"IcUserAgencyRightChanged", IcUserRoleForAgencyParams>
  | GenericEvent<"IcUserAgencyRightRejected", RejectIcUserRoleForAgencyParams>
  // API CONSUMER related
  | GenericEvent<"ApiConsumerSaved", { consumerId: string }>
  // ERRORED CONVENTION RELATED
  | GenericEvent<"PartnerErroredConventionMarkedAsHandled", { conventionId: ConventionId; userId: UserId }>;

export type DomainTopic = DomainEvent["topic"];

export type AssessmentEmailDomainTopic = ExtractFromExisting<
  DomainTopic,
  "EmailWithLinkToCreateAssessmentSent" | "BeneficiaryAssessmentEmailSent"
>;
