import type { AssessmentDto, ConventionDto } from "shared";
import type { InstantiatedUseCase } from "../../../../config/bootstrap/createUseCases";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { BroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import type { BroadcastToFranceTravailOnConventionUpdatesLegacy } from "./BroadcastToFranceTravailOnConventionUpdatesLegacy";
import type { BroadcastConventionParams } from "./broadcastConventionParams";

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

      if (featureFlags.enableStandardFormatBroadcastToFranceTravail.isActive)
        return broadcastToFranceTravailOnConventionUpdates.execute({
          eventType,
          ...params,
        });

      if (eventType === "CONVENTION_UPDATED") {
        return broadcastToFranceTravailOnConventionUpdatesLegacy.execute({
          convention: params.convention,
        });
      }
    },
  };
};
