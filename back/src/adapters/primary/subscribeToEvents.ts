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
  ImmersionApplicationSubmittedByBeneficiary: [
    useCases.confirmToBeneficiaryThatApplicationCorrectlySubmitted,
    useCases.confirmToBeneficiaryThatApplicationCorrectlySubmittedRequestSignature,
    useCases.confirmToMentorThatApplicationCorrectlySubmitted,
    useCases.confirmToMentorThatApplicationCorrectlySubmittedRequestSignature,
    useCases.notifyToTeamApplicationSubmittedByBeneficiary,
    useCases.notifyNewApplicationNeedsReview,
  ],
  ImmersionApplicationRejected: [
    useCases.notifyBeneficiaryAndEnterpriseThatApplicationIsRejected,
  ],
  ImmersionApplicationRequiresModification: [
    useCases.notifyBeneficiaryAndEnterpriseThatApplicationNeedsModifications,
  ],
  ImmersionApplicationAcceptedByCounsellor: [
    useCases.notifyNewApplicationNeedsReview,
  ],
  ImmersionApplicationAcceptedByValidator: [
    useCases.notifyNewApplicationNeedsReview,
  ],
  FinalImmersionApplicationValidationByAdmin: [
    useCases.notifyAllActorsOfFinalApplicationValidation,
  ],
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],
  FormEstablishmentAdded: [
    useCases.transformFormEstablishmentToSearchData,
    useCases.notifyConfirmationEstablishmentCreated,
  ],

  EmailContactRequestedByBeneficiary: [
    useCases.notifyEstablishmentOfContactRequest,
  ],
  ImmersionApplicationPartiallySigned: [
    useCases.notifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty,
  ],
});

export const subscribeToEvents = (deps: AppDependencies) => {
  const useCasesByTopic = getUseCasesByTopics(deps.useCases);
  keys(useCasesByTopic).forEach((topic) => {
    const useCases = useCasesByTopic[topic];

    useCases.forEach((useCase) =>
      deps.eventBus.subscribe(topic, (event) =>
        useCase.execute(event.payload as any),
      ),
    );
  });
};
