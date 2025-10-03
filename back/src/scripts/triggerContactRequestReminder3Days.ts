import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { makeSaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { makeContactRequestReminder } from "../domains/establishment/use-cases/ContactRequestReminder";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeContactRequestReminder = () => {
  logger.info({
    message: "Starting contact request reminder script 3 days without answers",
  });
  const timeGateway = new RealTimeGateway();

  return makeContactRequestReminder({
    deps: {
      domain: config.immersionFacileDomain,
      saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        timeGateway,
      ),
      timeGateway: timeGateway,
    },
    uowPerformer: createUowPerformer(config, createMakeProductionPgPool(config))
      .uowPerformer,
  }).execute("3days");
};

handleCRONScript(
  "contactRequestReminderScript3Days",
  config,
  executeContactRequestReminder,
  ({ numberOfNotifications }) =>
    `Total of reminders : ${numberOfNotifications}`,
  logger,
);
