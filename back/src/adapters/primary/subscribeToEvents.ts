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
    useCases.confirmToMentorThatApplicationCorrectlySubmitted,
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
  FormEstablishmentAdded: [useCases.transformFormEstablishmentToSearchData],
  MagicLinkRenewalRequested: [useCases.deliverRenewedMagicLink],
});

export const subscribeToEvents = (deps: AppDependencies) => {
  const useCasesByTopic = getUseCasesByTopics(deps.useCases);
  keys(useCasesByTopic).forEach((topic) => {
    const useCase = useCasesByTopic[topic];

    useCase.forEach((useCase) =>
      deps.eventBus.subscribe(topic, (event) =>
        useCase.execute(event.payload as any),
      ),
    );
  });
};
