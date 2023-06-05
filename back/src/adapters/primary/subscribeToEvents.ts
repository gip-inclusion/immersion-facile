import { keys } from "shared";
import { NarrowEvent } from "../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../domain/core/eventBus/events";
import type { AppDependencies } from "./config/createAppDependencies";
import { InstantiatedUseCase, UseCases } from "./config/createUseCases";

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
  // "Happy case" for immersion application.
  ImmersionApplicationSubmittedByBeneficiary: [
    useCases.bindConventionToFederatedIdentity,
  ],

  // ImmersionApplication Federated Identities
  FederatedIdentityBoundToConvention: [
    useCases.notifyToAgencyConventionSubmitted,
    useCases.confirmToSignatoriesThatConventionCorrectlySubmittedRequestSignature,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  FederatedIdentityNotBoundToConvention: [
    useCases.notifyToAgencyConventionSubmitted,
    useCases.confirmToSignatoriesThatConventionCorrectlySubmittedRequestSignature,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],

  ConventionSubmittedAfterModification: [
    // useCases.notifyToAgencyConventionSubmitted,
    useCases.confirmToSignatoriesThatConventionCorrectlySubmittedRequestSignature,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationPartiallySigned: [
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationFullySigned: [
    useCases.notifyLastSigneeThatConventionHasBeenSigned,
    useCases.notifyNewConventionNeedsReview,
    useCases.notifyPoleEmploiUserAdvisorOnConventionFullySigned,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationAcceptedByCounsellor: [
    useCases.notifyNewConventionNeedsReview,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationAcceptedByValidator: [
    useCases.notifyAllActorsOfFinalConventionValidation,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],

  // Edge cases for immersion application.
  ImmersionApplicationRequiresModification: [
    useCases.notifyBeneficiaryAndEnterpriseThatConventionNeedsModifications,
    {
      useCaseName: "BroadcastToPoleEmploi",
      execute: ({ convention }) =>
        useCases.broadcastToPoleEmploiOnConventionUpdates.execute(convention),
    },
  ],
  ImmersionApplicationRejected: [
    useCases.notifyBeneficiaryAndEnterpriseThatConventionIsRejected,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationCancelled: [
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationDeprecated: [],
  ConventionReminderRequired: [useCases.notifyConventionReminder],

  // Establishment form related
  FormEstablishmentAdded: [
    useCases.insertEstablishmentAggregateFromForm,
    useCases.notifyConfirmationEstablishmentCreated,
  ],
  FormEstablishmentEdited: [useCases.updateEstablishmentAggregateFromForm],
  FormEstablishmentEditLinkSent: [],
  NewEstablishmentAggregateInsertedFromForm: [
    useCases.notifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm,
  ],

  // Search related
  ContactRequestedByBeneficiary: [
    useCases.notifyContactRequest,
    useCases.insertDiscussionAggregateFromContactRequest,
  ],

  // Magic link renewal.
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],

  // Agency related :
  NewAgencyAdded: [],
  AgencyActivated: [useCases.sendEmailWhenAgencyIsActivated],
  AgencyUpdated: [],
  AgencyRegisteredToInclusionConnectedUser: [],

  // Immersion Assessment related:
  ImmersionAssessmentCreated: [],
  EmailWithLinkToCreateAssessmentSent: [],

  UserAuthenticatedSuccessfully: [],
  IcUserAgencyRightChanged: [useCases.notifyIcUserAgencyRightChanged],
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
