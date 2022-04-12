import { z } from "zod";
import { NarrowEvent } from "../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../domain/core/eventBus/events";
import { keys } from "../../shared/utils";
import { AppDependencies, UseCases } from "./config";

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
    useCases.confirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature,
    useCases.confirmToMentorThatApplicationCorrectlySubmittedRequestSignature,
    useCases.notifyToTeamApplicationSubmittedByBeneficiary,
    useCases.notifyToAgencyApplicationSubmitted,
  ],
  ImmersionApplicationPartiallySigned: [
    useCases.notifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty,
  ],
  ImmersionApplicationFullySigned: [useCases.notifyNewApplicationNeedsReview],
  ImmersionApplicationAcceptedByCounsellor: [
    useCases.notifyNewApplicationNeedsReview,
  ],
  ImmersionApplicationAcceptedByValidator: [
    useCases.notifyAllActorsOfFinalApplicationValidation,
  ],

  FinalImmersionApplicationValidationByAdmin: [
    useCases.notifyAllActorsOfFinalApplicationValidation,
  ],

  // Edge cases for immersion application.
  ImmersionApplicationRequiresModification: [
    useCases.notifyBeneficiaryAndEnterpriseThatApplicationNeedsModifications,
  ],
  ImmersionApplicationRejected: [
    useCases.notifyBeneficiaryAndEnterpriseThatApplicationIsRejected,
  ],

  // Establishment form related
  FormEstablishmentAdded: [
    useCases.upsertEstablishmentAggregateFromForm,
    useCases.notifyConfirmationEstablishmentCreated,
  ],
  FormEstablishmentEdited: [useCases.upsertEstablishmentAggregateFromForm],
  FormEstablishmentEditLinkSent: [],

  // Search related
  ContactRequestedByBeneficiary: [useCases.notifyContactRequest],

  // Magic link renewal.
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],

  // Agency related :
  NewAgencyAdded: [],
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
