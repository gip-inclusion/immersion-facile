import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { makeSaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { ContactRequestReminder } from "../domains/establishment/use-cases/ContactRequestReminder";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeContactRequestReminder = () => {
  logger.info({
    message: "Starting contact request reminder script 3 days without answers",
  });
  const timeGateway = new RealTimeGateway();

  return new ContactRequestReminder(
    createUowPerformer(config, createGetPgPoolFn(config)).uowPerformer,
    makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
    timeGateway,
    config.immersionFacileDomain,
  ).execute("3days");
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "contactRequestReminderScript3Days",
  config,
  executeContactRequestReminder,
  (notificationsQty) => `Total of reminders : ${notificationsQty}`,
  logger,
);
