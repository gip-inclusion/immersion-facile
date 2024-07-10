import { keys } from "shared";
import type { AppDependencies } from "../../../config/bootstrap/createAppDependencies";
import {
  InstantiatedUseCase,
  UseCases,
} from "../../../config/bootstrap/createUseCases";
import { DomainTopic } from "./events";
import { NarrowEvent } from "./ports/EventBus";

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
  ExchangeAddedToDiscussion: [useCases.sendExchangeToRecipient],
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
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  FederatedIdentityNotBoundToConvention: [
    useCases.notifyToAgencyConventionSubmitted,
    useCases.notifySignatoriesThatConventionSubmittedNeedsSignature,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionSubmittedAfterModification: [
    useCases.notifySignatoriesThatConventionSubmittedNeedsSignatureAfterNotification,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionPartiallySigned: [
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionFullySigned: [
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.notifyNewConventionNeedsReview,
    useCases.notifyPoleEmploiUserAdvisorOnConventionFullySigned,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionAcceptedByCounsellor: [
    useCases.notifyNewConventionNeedsReview,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionAcceptedByValidator: [
    useCases.notifyAllActorsOfFinalConventionValidation,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
    useCases.addEstablishmentLead,
  ],

  // Edge cases for immersion application.
  ConventionRequiresModification: [
    useCases.notifyActorThatConventionNeedsModifications,
    useCases.broadcastToPartnersOnConventionUpdates,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ConventionRejected: [
    useCases.notifyAllActorsThatConventionIsRejected,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionCancelled: [
    useCases.notifyAllActorsThatConventionIsCancelled,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionDeprecated: [
    useCases.notifyAllActorsThatConventionIsDeprecated,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
    useCases.broadcastToPartnersOnConventionUpdates,
  ],
  ConventionReminderRequired: [useCases.notifyConventionReminder],

  // Establishment form related
  FormEstablishmentAdded: [
    useCases.insertEstablishmentAggregateFromForm,
    useCases.notifyConfirmationEstablishmentCreated,
    useCases.markEstablishmentLeadAsRegistrationAccepted,
  ],
  FormEstablishmentEdited: [useCases.updateEstablishmentAggregateFromForm],
  FormEstablishmentEditLinkSent: [],
  NewEstablishmentAggregateInsertedFromForm: [
    useCases.notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm,
  ],
  // Establishment lead related
  EstablishmentLeadReminderSent: [],

  // Search related
  ContactRequestedByBeneficiary: [useCases.notifyContactRequest],

  // Magic link renewal.
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],

  // Agency related :
  NewAgencyAdded: [useCases.sendEmailWhenNewAgencyOfTypeOtherAdded],
  AgencyActivated: [useCases.sendEmailsWhenAgencyIsActivated],
  AgencyUpdated: [useCases.updateAgencyReferringToUpdatedAgency],
  AgencyRejected: [useCases.sendEmailWhenAgencyIsRejected],
  AgencyRegisteredToInclusionConnectedUser: [],

  // Assessment related:
  AssessmentCreated: [useCases.notifyAgencyThatAssessmentIsCreated],
  EmailWithLinkToCreateAssessmentSent: [],
  BeneficiaryAssessmentEmailSent: [],

  UserAuthenticatedSuccessfully: [
    useCases.linkFranceTravailUsersToTheirAgencies,
  ],
  IcUserAgencyRightChanged: [useCases.notifyIcUserAgencyRightChanged],
  IcUserAgencyRightRejected: [useCases.notifyIcUserAgencyRightRejected],
  //Api Consumer related:
  ApiConsumerSaved: [],
  //partnersErroredConvention related
  PartnerErroredConventionMarkedAsHandled: [],
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
