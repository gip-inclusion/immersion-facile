import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { FranceTravailGateway } from "../../ports/FranceTravailGateway";
import { makeBroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import { BroadcastToFranceTravailOnConventionUpdatesLegacy } from "./BroadcastToFranceTravailOnConventionUpdatesLegacy";
import type { BroadcastConventionParams } from "./broadcastConventionParams";

export const makeBroadcastToFranceTravailOrchestrator = ({
  uowPerformer,
  ...deps
}: {
  uowPerformer: UnitOfWorkPerformer;
  franceTravailGateway: FranceTravailGateway;
  timeGateway: TimeGateway;
  options: { resyncMode: boolean };
}) => {
  const broadcastToFranceTravailOnConventionUpdates =
    makeBroadcastToFranceTravailOnConventionUpdates({
      uowPerformer,
      deps,
    });

  const broadcastToFranceTravailOnConventionUpdatesLegacy =
    new BroadcastToFranceTravailOnConventionUpdatesLegacy(
      uowPerformer,
      deps.franceTravailGateway,
      deps.timeGateway,
      deps.options,
    );

  return async (params: BroadcastConventionParams) => {
    const featureFlags = await uowPerformer.perform(async (uow) =>
      uow.featureFlagRepository.getAll(),
    );
    if (featureFlags.enableStandardFormatBroadcastToFranceTravail.isActive)
      return broadcastToFranceTravailOnConventionUpdates.execute(params);

    if (params.eventType === "CONVENTION_UPDATED") {
      return broadcastToFranceTravailOnConventionUpdatesLegacy.execute({
        convention: params.convention,
      });
    }
  };
};
