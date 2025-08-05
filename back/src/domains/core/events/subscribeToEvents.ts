import { keys, type WithConventionDto, type WithSiretDto } from "shared";
import type { AppDependencies } from "../../../config/bootstrap/createAppDependencies";
import type {
  InstantiatedUseCase,
  UseCases,
} from "../../../config/bootstrap/createUseCases";
import type { WithEstablishmentAggregate } from "../../establishment/entities/EstablishmentAggregate";
import type { DomainTopic } from "./events";
import type { NarrowEvent } from "./ports/EventBus";

type DomainUseCase = UseCases[keyof UseCases];

type ExtractUseCasesMatchingTopic<Topic extends DomainTopic> = Parameters<
  DomainUseCase["execute"]
>[0] extends NarrowEvent<Topic>["payload"]
  ? InstantiatedUseCase<NarrowEvent<Topic>["payload"], void, any>
  : never;

type UseCaseSubscriptionsByTopics = {
  [K in DomainTopic]: ExtractUseCasesMatchingTopic<K>[];
};

const getUseCasesByTopics = (
  useCases: UseCases,
): UseCaseSubscriptionsByTopics => ({
  NotificationAdded: [useCases.sendNotification],
  ExchangeAddedToDiscussion: [
    useCases.sendExchangeToRecipient,
    useCases.updateMarketingEstablishmentContactList,
  ],
  DiscussionExchangeDeliveryFailed: [
    useCases.warnSenderThatMessageCouldNotBeDelivered,
  ],
  DiscussionStatusManuallyUpdated: [
    {
      useCaseName: useCases.sendExchangeToRecipient.useCaseName,
      execute: async ({ discussion, skipSendingEmail, triggeredBy }) =>
        useCases.sendExchangeToRecipient.execute({
          discussionId: discussion.id,
          triggeredBy,
          skipSendingEmail,
        }),
    },
  ],
  DiscussionMarkedAsDeprecated: [useCases.markDiscussionDeprecatedAndNotify],
  NotificationBatchAdded: [useCases.sendNotificationsInBatch],

  // "Happy case" for conventions.
  ConventionSubmittedByBeneficiary: [
    useCases.bindConventionToFederatedIdentity,
    useCases.markDiscussionLinkedToConvention,
  ],

  // Convention Federated Identities
  FederatedIdentityBoundToConvention: [
    useCases.notifyToAgencyConventionSubmitted,
    useCases.notifySignatoriesThatConventionSubmittedNeedsSignature,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  FederatedIdentityNotBoundToConvention: [
    useCases.notifyToAgencyConventionSubmitted,
    useCases.notifySignatoriesThatConventionSubmittedNeedsSignature,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],

  ConventionSubmittedAfterModification: [
    useCases.notifySignatoriesThatConventionSubmittedNeedsSignatureAfterNotification,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionModifiedAndSigned: [
    useCases.notifySignatoriesThatConventionSubmittedNeedsSignatureAfterNotification,
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionPartiallySigned: [
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionFullySigned: [
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.notifyNewConventionNeedsReview,
    useCases.notifyFranceTravailUserAdvisorOnConventionFullySigned,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionAcceptedByCounsellor: [
    useCases.notifyNewConventionNeedsReview,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionAcceptedByValidator: [
    useCases.notifyAllActorsOfFinalConventionValidation,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
    useCases.addEstablishmentLead,
    extractSiretFromConvention(
      useCases.updateMarketingEstablishmentContactList,
    ),
  ],
  ConventionTransferredToAgency: [
    useCases.notifyAllActorsThatConventionHasBeenTransferred,
  ],
  ConventionCounsellorNameEdited: [],

  // Edge cases for immersion application.

  ConventionRejected: [
    useCases.notifyAllActorsThatConventionIsRejected,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionCancelled: [
    useCases.notifyAllActorsThatConventionIsCancelled,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionDeprecated: [
    useCases.notifyAllActorsThatConventionIsDeprecated,
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionSignatureLinkManuallySent: [],
  ConventionReminderRequired: [useCases.notifyConventionReminder],

  // Establishment form related
  UpdatedEstablishmentAggregateInsertedFromForm: [
    useCases.updateMarketingEstablishmentContactList,
  ],
  NewEstablishmentAggregateInsertedFromForm: [
    extractSiretFromArg(useCases.notifyConfirmationEstablishmentCreated),
    extractSiretFromArg(
      useCases.notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm,
    ),
    extractSiretFromArg(useCases.updateMarketingEstablishmentContactList),
    extractSiretFromArg(useCases.markEstablishmentLeadAsRegistrationAccepted),
  ],
  EstablishmentDeleted: [],
  // Establishment lead related
  EstablishmentLeadReminderSent: [],

  // Search related
  ContactRequestedByBeneficiary: [
    useCases.notifyContactRequest,
    useCases.notifyCandidateThatContactRequestHasBeenSent,
    useCases.updateMarketingEstablishmentContactList,
  ],

  // Magic link renewal.
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],

  // Agency related :
  NewAgencyAdded: [useCases.sendEmailWhenNewAgencyOfTypeOtherAdded],
  AgencyActivated: [useCases.sendEmailsWhenAgencyIsActivated],
  AgencyUpdated: [useCases.updateAgencyReferringToUpdatedAgency],
  AgencyRejected: [useCases.sendEmailWhenAgencyIsRejected],
  AgencyRegisteredToConnectedUser: [],

  // Assessment related:
  AssessmentCreated: [
    useCases.notifyAgencyThatAssessmentIsCreated,
    useCases.notifyEstablishmentThatAssessmentWasCreated,
    useCases.notifyBeneficiaryThatAssessmentIsCreated,
    useCases.broadcastToFranceTravailOnAssessmentCreated,
  ],
  EmailWithLinkToCreateAssessmentSent: [],
  BeneficiaryAssessmentEmailSent: [],
  AssessmentReminderManuallySent: [],

  UserAuthenticatedSuccessfully: [
    useCases.linkFranceTravailUsersToTheirAgencies,
  ],
  ConnectedUserAgencyRightChanged: [
    useCases.notifyUserAgencyRightChanged,
    useCases.updateAgencyReferringToUpdatedAgency,
  ],
  ConnectedUserAgencyRightRejected: [useCases.notifyUserAgencyRightRejected],

  //Api Consumer related:
  ApiConsumerSaved: [],

  //partnersConvention related
  PartnerErroredConventionMarkedAsHandled: [],
  ConventionWithAssessmentBroadcastRequested: [
    useCases.broadcastToFranceTravailOnAssessmentCreated,
  ],
  ConventionBroadcastRequested: [
    useCases.broadcastToFranceTravailOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
});

export const subscribeToEvents = (deps: AppDependencies) => {
  const useCasesByTopic = getUseCasesByTopics(deps.useCases);
  keys(useCasesByTopic).forEach((topic) => {
    const useCases = useCasesByTopic[topic];

    useCases.forEach((useCase) => {
      // the provided key for each use case is needed in order to follow the acknowledgments
      const subscriptionId = useCase.useCaseName; // careful this is fragile, because the subscription id is stored in DB when failing
      deps.eventBus.subscribe(topic, subscriptionId, async (event) => {
        await useCase.execute(event.payload as any);
      });
    });
  });
};

const extractSiretFromArg = <
  UC extends InstantiatedUseCase<WithSiretDto, void, any>,
>(
  useCase: UC,
): InstantiatedUseCase<WithEstablishmentAggregate, void, any> => ({
  useCaseName: useCase.useCaseName,
  execute: (params) =>
    useCase.execute({
      siret: params.establishmentAggregate.establishment.siret,
    }),
});

const extractSiretFromConvention = <
  UC extends InstantiatedUseCase<WithSiretDto, void, any>,
>(
  useCase: UC,
): InstantiatedUseCase<WithConventionDto, void, any> => ({
  useCaseName: useCase.useCaseName,
  execute: (params) =>
    useCase.execute({
      siret: params.convention.siret,
    }),
});
