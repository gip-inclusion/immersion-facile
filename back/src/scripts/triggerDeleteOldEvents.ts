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
  const totalLimit = Number(process.argv.at(2) ?? 250_000);
  const batchSize = 1_000;

  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  const deleteEvents = makeDeleteEvents({
    uowPerformer,
    deps: { timeGateway: new RealTimeGateway() },
  });

  let totalDeletedEvents = 0;

  while (totalDeletedEvents < totalLimit) {
    const remaining = totalLimit - totalDeletedEvents;
    const limitForThisBatch = Math.min(batchSize, remaining);

    const { deletedEvents } = await deleteEvents.execute({
      limit: limitForThisBatch,
    });

    if (deletedEvents === 0) {
      logger.info({ message: "No more events to delete." });
      break;
    }

    totalDeletedEvents += deletedEvents;

    logger.info({
      message: `Batch deleted: ${deletedEvents}, total deleted: ${totalDeletedEvents}/${totalLimit}`,
    });
  }

  return { deletedEvents: totalDeletedEvents };
};

handleCRONScript({
  name: "triggerDeleteOldEvents",
  config,
  script: deleteOldEvents,
  handleResults: ({ deletedEvents }) => `${deletedEvents} events deleted.`,
  logger,
});
