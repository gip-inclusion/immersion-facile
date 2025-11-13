import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { makeDeleteEvents } from "../domains/core/events/usecase/DeleteEvents";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createDbRelatedSystems } from "../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const deleteOldEvents = async () => {
  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  return makeDeleteEvents({
    uowPerformer,
    deps: { timeGateway: new RealTimeGateway() },
  }).execute({
    limit: 250_000,
  });
};

handleCRONScript({
  name: "triggerDeleteOldEvents",
  config,
  script: deleteOldEvents,
  handleResults: ({ deletedEvents }) => `${deletedEvents} events deleted.`,
  logger,
});
