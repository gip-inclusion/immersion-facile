import { type WithConventionDto, type WithSiretDto, keys } from "shared";
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
  NotificationBatchAdded: [useCases.sendNotificationsInBatch],
  // "Happy case" for immersion application.
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

  // Edge cases for immersion application.
  ConventionRequiresModification: [
    useCases.notifyActorThatConventionNeedsModifications,
    useCases.broadcastToPartnersOnConventionUpdates,
    useCases.broadcastToFranceTravailOnConventionUpdates,
  ],
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
  AgencyRegisteredToInclusionConnectedUser: [],

  // Assessment related:
  AssessmentCreated: [
    useCases.notifyAgencyThatAssessmentIsCreated,
    useCases.notifyEstablishmentThatAssessmentWasCreated,
    useCases.notifyBeneficiaryThatAssessmentIsCreated,
    useCases.broadcastToFranceTravailOnAssessmentCreated,
  ],
  EmailWithLinkToCreateAssessmentSent: [],
  BeneficiaryAssessmentEmailSent: [],

  UserAuthenticatedSuccessfully: [
    useCases.linkFranceTravailUsersToTheirAgencies,
  ],
  IcUserAgencyRightChanged: [
    useCases.notifyIcUserAgencyRightChanged,
    useCases.updateAgencyReferringToUpdatedAgency,
  ],
  IcUserAgencyRightRejected: [useCases.notifyIcUserAgencyRightRejected],

  //Api Consumer related:
  ApiConsumerSaved: [],

  //partnersConvention related
  PartnerErroredConventionMarkedAsHandled: [],
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
