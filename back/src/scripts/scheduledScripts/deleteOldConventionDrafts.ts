import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { makeGetOldConventionDraftsAndEmitDeleteEvent } from "../../domains/convention/use-cases/GetOldConventionDraftsAndEmitDeleteEvent";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { RealTimeGateway } from "../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const deleteOldConventionDrafts = async (): Promise<{
  numberOfConventionDraftsDeleted: number;
}> => {
  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );
  const timeGateway = new RealTimeGateway();
  const uuidGenerator = new UuidV4Generator();
  const createNewEvent = makeCreateNewEvent({
    timeGateway,
    uuidGenerator,
  });

  const getOldConventionDraftsAndEmitDeleteEvent =
    makeGetOldConventionDraftsAndEmitDeleteEvent({
      uowPerformer,
      deps: {
        timeGateway,
        createNewEvent,
      },
    });

  const { numberOfOldConventionDraftIds } =
    await getOldConventionDraftsAndEmitDeleteEvent.execute();

  return {
    numberOfConventionDraftsDeleted: numberOfOldConventionDraftIds,
  };
};

export const triggerDeleteOldConventionDrafts = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldConventionDrafts",
    config,
    script: monitoredAsUseCase({
      name: "DeleteOldConventionDrafts",
      cb: deleteOldConventionDrafts,
    }),
    handleResults: ({ numberOfConventionDraftsDeleted }) =>
      `${numberOfConventionDraftsDeleted} convention drafts were deleted`,
    logger,
    exitOnFinish,
  });
