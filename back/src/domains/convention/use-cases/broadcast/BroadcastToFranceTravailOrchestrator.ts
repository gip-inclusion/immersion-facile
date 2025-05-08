import { type AssessmentDto, type ConventionDto, errors } from "shared";
import type { InstantiatedUseCase } from "../../../../config/bootstrap/createUseCases";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { BroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import type { BroadcastToFranceTravailOnConventionUpdatesLegacy } from "./BroadcastToFranceTravailOnConventionUpdatesLegacy";
import type { BroadcastConventionParams } from "./broadcastConventionParams";

export type BroadcastToFranceTravailOrchestrator = ReturnType<
  typeof makeBroadcastToFranceTravailOrchestrator
>;
export const makeBroadcastToFranceTravailOrchestrator = ({
  uowPerformer,
  broadcastToFranceTravailOnConventionUpdatesLegacy,
  broadcastToFranceTravailOnConventionUpdates,
  eventType,
}: {
  uowPerformer: UnitOfWorkPerformer;
  eventType: BroadcastConventionParams["eventType"];
  broadcastToFranceTravailOnConventionUpdates: BroadcastToFranceTravailOnConventionUpdates;
  broadcastToFranceTravailOnConventionUpdatesLegacy: BroadcastToFranceTravailOnConventionUpdatesLegacy;
}): InstantiatedUseCase<{
  convention: ConventionDto;
  assessment?: AssessmentDto;
}> => {
  return {
    useCaseName: "BroadcastToFranceTravailOrchestrator",
    execute: async (params) => {
      const featureFlags = await uowPerformer.perform(async (uow) =>
        uow.featureFlagRepository.getAll(),
      );

      if (featureFlags.enableStandardFormatBroadcastToFranceTravail.isActive) {
        if (eventType === "ASSESSMENT_CREATED") {
          if (!params.assessment)
            throw errors.assessment.missingAssessment({
              conventionId: params.convention.id,
            });

          return broadcastToFranceTravailOnConventionUpdates.execute({
            eventType: "ASSESSMENT_CREATED",
            convention: params.convention,
            assessment: params.assessment,
          });
        }

        return broadcastToFranceTravailOnConventionUpdates.execute({
          eventType: "CONVENTION_UPDATED",
          convention: params.convention,
        });
      }

      if (eventType === "CONVENTION_UPDATED") {
        return broadcastToFranceTravailOnConventionUpdatesLegacy.execute({
          convention: params.convention,
        });
      }
    },
  };
};
