import { z } from "zod";
import { NarrowEvent } from "../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../domain/core/eventBus/events";
import { FeatureFlags } from "../../shared/featureFlags";
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
  featureFlags: FeatureFlags,
): UseCaseSubscriptionsByTopics => {
  const onSubmitEvents = featureFlags.enableEnterpriseSignature
    ? [
        // Request signatures from both parties. Next event triggered is ImmersionApplicationPartiallySigned/ImmersionApplicationFullySigned.
        useCases.confirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature,
        useCases.confirmToMentorThatApplicationCorrectlySubmittedRequestSignature,
        useCases.notifyToTeamApplicationSubmittedByBeneficiary,
      ]
    : [
        // The application is submitted in signed state. Notify accordingly.
        useCases.confirmToBeneficiaryThatApplicationCorrectlySubmitted,
        useCases.confirmToMentorThatApplicationCorrectlySubmitted,
        useCases.notifyToTeamApplicationSubmittedByBeneficiary,
        useCases.notifyNewApplicationNeedsReview,
      ];
  return {
    // "Happy case" for immersion application.
    ImmersionApplicationSubmittedByBeneficiary: onSubmitEvents,
    // This event is only triggered with enableEnterpriseSignature flag.
    ImmersionApplicationPartiallySigned: [
      // Currently there's no need to send this notification. Keep if for later if necessary.
      // useCases.notifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty,
    ],
    // This event is only triggered with enableEnterpriseSignature flag.
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

    // Estasblishment form and search related.
    FormEstablishmentAdded: [
      useCases.transformFormEstablishmentToSearchData,
      useCases.notifyConfirmationEstablishmentCreated,
    ],
    EmailContactRequestedByBeneficiary: [
      useCases.notifyEstablishmentOfContactRequest,
    ],

    // Magic link renewal.
    MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],
  };
};

export const subscribeToEvents = (deps: AppDependencies) => {
  const useCasesByTopic = getUseCasesByTopics(deps.useCases, deps.featureFlags);
  keys(useCasesByTopic).forEach((topic) => {
    const useCases = useCasesByTopic[topic];

    useCases.forEach((useCase) =>
      deps.eventBus.subscribe(topic, (event) =>
        useCase.execute(event.payload as any),
      ),
    );
  });
};
