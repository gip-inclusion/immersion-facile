import {
  type AgencyId,
  type ContactEstablishmentEventPayload,
  type ConventionId,
  type DateString,
  type Flavor,
  type RejectConnectedUserRoleForAgencyParams,
  type Role,
  roleSchema,
  type SignatoryRole,
  type UserId,
  userIdSchema,
  type WithAgencyId,
  type WithAgencyIdAndUserId,
  type WithAssessmentDto,
  type WithConventionDto,
  type WithConventionId,
  type WithConventionIdLegacy,
  type WithDiscussionDto,
  type WithDiscussionId,
  type WithOptionalFirstnameAndLastname,
  type WithSiretDto,
} from "shared";
import { z } from "zod";
import type { UserAuthenticatedPayload } from "../../connected-users/use-cases/LinkFranceTravailUsersToTheirAgencies";
import type { RenewMagicLinkPayload } from "../../convention/use-cases/notifications/DeliverRenewedMagicLink";
import type { WithEstablishmentAggregate } from "../../establishment/entities/EstablishmentAggregate";
import type { WarnSenderThatMessageCouldNotBeDeliveredParams } from "../../establishment/use-cases/discussions/WarnSenderThatMessageCouldNotBeDelivered";
import type { WithNotificationIdAndKind } from "../notifications/helpers/Notification";
import type {
  ConventionReminderPayload,
  TransferConventionToAgencyPayload,
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
  priority?: number;
};

export type NotificationAddedEvent = GenericEvent<
  "NotificationAdded",
  WithNotificationIdAndKind
>;
export type NotificationBatchAddedEvent = GenericEvent<
  "NotificationBatchAdded",
  WithNotificationIdAndKind[]
>;

export type TriggeredBy =
  | { kind: "connected-user"; userId: UserId }
  | { kind: "convention-magic-link"; role: Role }
  | { kind: "crawler" };

export const triggeredBySchema: z.Schema<TriggeredBy> = z.discriminatedUnion(
  "kind",
  [
    z.object({ kind: z.literal("connected-user"), userId: userIdSchema }),
    z.object({ kind: z.literal("convention-magic-link"), role: roleSchema }),
    z.object({ kind: z.literal("crawler") }),
  ],
);

export type WithTriggeredBy = {
  triggeredBy: TriggeredBy | null;
};

// biome-ignore format: better readability without formatting
export type DomainEvent =
  | NotificationAddedEvent
  | NotificationBatchAddedEvent
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  | GenericEvent<"ConventionSubmittedByBeneficiary", WithConventionDto & Partial<WithDiscussionId> & WithTriggeredBy>
  | GenericEvent<"ConventionSubmittedAfterModification", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionPartiallySigned", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionFullySigned", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionModifiedAndSigned", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionAcceptedByCounsellor", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionAcceptedByValidator", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionReminderRequired", ConventionReminderPayload>
  | GenericEvent<"ConventionWithAssessmentBroadcastRequested", WithConventionDto & WithAssessmentDto & WithTriggeredBy>
  | GenericEvent<"ConventionBroadcastRequested", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionTransferredToAgency", TransferConventionToAgencyPayload & WithTriggeredBy>
  | GenericEvent<"ConventionCounsellorNameEdited", WithConventionId & WithOptionalFirstnameAndLastname & WithTriggeredBy>
  | GenericEvent<"ConventionSignatureLinkManuallySent", WithConventionDto & { recipientRole: SignatoryRole, transport: "sms" } & WithTriggeredBy>
  | GenericEvent<"AssessmentReminderManuallySent", WithConventionDto & { transport: "sms" } & WithTriggeredBy>
  // UNHAPPY PATHS
  | GenericEvent<"ConventionRejected", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionCancelled", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"ConventionDeprecated", WithConventionDto & WithTriggeredBy>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload & WithTriggeredBy>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentEventPayload & WithTriggeredBy>
  | GenericEvent<"NewEstablishmentAggregateInsertedFromForm", WithEstablishmentAggregate & WithTriggeredBy>
  | GenericEvent<"UpdatedEstablishmentAggregateInsertedFromForm", WithSiretDto & WithTriggeredBy>
  | GenericEvent<"EstablishmentDeleted", WithSiretDto & WithTriggeredBy>
  | GenericEvent<"ExchangeAddedToDiscussion", WithSiretDto & WithDiscussionId>
  | GenericEvent<"DiscussionExchangeDeliveryFailed", WarnSenderThatMessageCouldNotBeDeliveredParams>
  | GenericEvent<"DiscussionStatusManuallyUpdated", WithDiscussionDto & { skipSendingEmail?: boolean } & WithTriggeredBy>
  | GenericEvent<"DiscussionMarkedAsDeprecated", WithDiscussionId & WithTriggeredBy>
  | GenericEvent<"DiscussionBeneficiaryFollowUpRequested", WithDiscussionId & WithTriggeredBy>

  // ESTABLISHMENT LEAD RELATED
  | GenericEvent<"EstablishmentLeadReminderSent", WithConventionIdLegacy>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", WithAgencyId & WithTriggeredBy>
  | GenericEvent<"AgencyActivated", WithAgencyId & WithTriggeredBy>
  | GenericEvent<"AgencyUpdated", WithAgencyId & WithTriggeredBy>
  | GenericEvent<"AgencyRejected", WithAgencyId & WithTriggeredBy>

  // IMMERSION ASSESSMENT related
  | GenericEvent<"AssessmentCreated", WithConventionDto & WithAssessmentDto & WithTriggeredBy>
  | GenericEvent<"EmailWithLinkToCreateAssessmentSent", WithConventionIdLegacy>
  | GenericEvent<"BeneficiaryAssessmentEmailSent", WithConventionIdLegacy>

  // PECONNECT related
  | GenericEvent<"FederatedIdentityBoundToConvention", WithConventionDto & WithTriggeredBy>
  | GenericEvent<"FederatedIdentityNotBoundToConvention", WithConventionDto & WithTriggeredBy>
  // USER CONNECTED related.
  // We don't put full OAuth in payload to avoid private data in logs etc...
  | GenericEvent<"UserAuthenticatedSuccessfully", UserAuthenticatedPayload & WithTriggeredBy>


  // Est-ce que les deux events au final c'est pas la même chose ???????!!!!!!! De quoi péter un gros boulard!
  | GenericEvent<"AgencyRegisteredToConnectedUser", { userId: UserId; agencyIds: AgencyId[] } & WithTriggeredBy> // Old name AgencyRegisteredToInclusionConnectedUser
  | GenericEvent<"ConnectedUserAgencyRightChanged", WithAgencyIdAndUserId & WithTriggeredBy> // Old name IcUserAgencyRightChanged


  | GenericEvent<"ConnectedUserAgencyRightRejected", RejectConnectedUserRoleForAgencyParams & WithTriggeredBy> // Old name IcUserAgencyRightRejected
  // API CONSUMER related
  | GenericEvent<"ApiConsumerSaved", { consumerId: string } & WithTriggeredBy>
  // ERRORED CONVENTION RELATED
  | GenericEvent<"PartnerErroredConventionMarkedAsHandled", { conventionId: ConventionId; userId: UserId } & WithTriggeredBy>;

export type DomainTopic = DomainEvent["topic"];
