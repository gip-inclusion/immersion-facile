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
  ],
  ImmersionApplicationPartiallySigned: [
    // Currently there's no need to send this notification. Keep if for later if necessary.
    // useCases.notifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty,
  ],
  ImmersionApplicationFullySigned: [useCases.notifyNewApplicationNeedsReview],
  ImmersionApplicationAcceptedByCounsellor: [
    useCases.notifyNewApplicationNeedsReview,
  ],
  ImmersionApplicationAcceptedByValidator: [
    useCases.notifyNewApplicationNeedsReview,
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

  // Establishment form and search related.
  FormEstablishmentAdded: [
    useCases.transformFormEstablishmentToSearchData,
    useCases.notifyConfirmationEstablishmentCreated,
  ],
  ContactRequestedByBeneficiary: [useCases.notifyContactRequest],

  // Magic link renewal.
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],

  // Edit establishment form
  FormEstablishmentEditLinkSent: [],
});

export const subscribeToEvents = (deps: AppDependencies) => {
  const useCasesByTopic = getUseCasesByTopics(deps.useCases);
  keys(useCasesByTopic).forEach((topic) => {
    const useCases = useCasesByTopic[topic];

    useCases.forEach((useCase) =>
      deps.eventBus.subscribe(topic, async (event) => {
        await useCase.execute(event.payload as any);
      }),
    );
  });
};
