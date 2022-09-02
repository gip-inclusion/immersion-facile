import { keys } from "shared/src/utils";
import { z } from "zod";
import { NarrowEvent } from "../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../domain/core/eventBus/events";
import type { AppDependencies } from "./config/createAppDependencies";
import { UseCases } from "./config/createUseCases";

type DomainUseCase = UseCases[keyof UseCases];

type ExtractUseCasesMatchingTopic<Topic extends DomainTopic> = Extract<
  DomainUseCase,
  { inputSchema: z.ZodSchema<NarrowEvent<Topic>["payload"]> }
>;

type UseCaseSubscriptionsByTopics = {
  [K in DomainTopic]: ExtractUseCasesMatchingTopic<K>[];
};

const getUseCasesByTopics = (
  useCases: UseCases,
): UseCaseSubscriptionsByTopics => ({
  // "Happy case" for immersion application.
  ImmersionApplicationSubmittedByBeneficiary: [
    useCases.confirmToBeneficiaryThatConventionCorrectlySubmittedRequestSignature,
    useCases.confirmToMentorThatConventionCorrectlySubmittedRequestSignature,
    useCases.notifyToAgencyConventionSubmitted,
    useCases.associatePeConnectFederatedIdentity,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ConventionSubmittedAfterModification: [
    useCases.confirmToBeneficiaryThatConventionCorrectlySubmittedRequestSignature,
    useCases.confirmToMentorThatConventionCorrectlySubmittedRequestSignature,
    useCases.notifyToAgencyConventionSubmitted,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationPartiallySigned: [
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationFullySigned: [
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
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationRejected: [
    useCases.notifyBeneficiaryAndEnterpriseThatConventionIsRejected,
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],
  ImmersionApplicationCancelled: [
    useCases.broadcastToPoleEmploiOnConventionUpdates,
  ],

  // ImmersionApplication Federated Identities
  PeConnectFederatedIdentityAssociated: [
    useCases.notifyPoleEmploiUserAdvisorOnAssociation,
  ],

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
  ContactRequestedByBeneficiary: [useCases.notifyContactRequest],

  // Magic link renewal.
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],

  // Agency related :
  NewAgencyAdded: [],
  AgencyActivated: [useCases.sendEmailWhenAgencyIsActivated],

  // Immersion Assessment related:
  ImmersionAssessmentCreated: [],
  EmailWithLinkToCreateAssessmentSent: [],
});

export const subscribeToEvents = (deps: AppDependencies) => {
  const useCasesByTopic = getUseCasesByTopics(deps.useCases);
  keys(useCasesByTopic).forEach((topic) => {
    const useCases = useCasesByTopic[topic];

    useCases.forEach((useCase) => {
      // the provided key for each use case is needed in order to follow the acknowledgments
      const subscriptionId = useCase.constructor.name; // careful this is fragile, because the subscription id is stored in DB when failing
      deps.eventBus.subscribe(topic, subscriptionId, async (event) => {
        await useCase.execute(event.payload as any);
      });
    });
  });
};
