import { z } from "zod";
import { NarrowEvent } from "../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../domain/core/eventBus/events";
import { keys } from "shared/src/utils";
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
    useCases.notifyToTeamConventionSubmittedByBeneficiary,
    useCases.notifyToAgencyConventionSubmitted,
    useCases.associatePeConnectFederatedIdentity,
  ],
  ImmersionApplicationPartiallySigned: [
    useCases.notifyBeneficiaryOrEnterpriseThatConventionWasSignedByOtherParty,
  ],
  ImmersionApplicationFullySigned: [
    useCases.notifyNewConventionNeedsReview,
    useCases.notifyPoleEmploiUserAdvisorOnConventionFullySigned,
  ],
  ImmersionApplicationAcceptedByCounsellor: [
    useCases.notifyNewConventionNeedsReview,
  ],
  ImmersionApplicationAcceptedByValidator: [
    useCases.notifyAllActorsOfFinalConventionValidation,
  ],

  FinalImmersionApplicationValidationByAdmin: [
    useCases.notifyAllActorsOfFinalConventionValidation,
  ],

  // Edge cases for immersion application.
  ImmersionApplicationRequiresModification: [
    useCases.notifyBeneficiaryAndEnterpriseThatConventionNeedsModifications,
  ],
  ImmersionApplicationRejected: [
    useCases.notifyBeneficiaryAndEnterpriseThatConventionIsRejected,
  ],
  ImmersionApplicationCancelled: [],

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
