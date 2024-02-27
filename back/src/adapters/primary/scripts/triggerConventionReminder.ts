import { filterNotFalsy } from "shared";
import { ConventionsReminder } from "../../../domain/convention/useCases/ConventionsReminder";
import { makeCreateNewEvent } from "../../../domain/core/events/ports/EventBus";
import { RealTimeGateway } from "../../../domain/core/time-gateway/adapters/RealTimeGateway";
import { UuidV4Generator } from "../../../domain/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";
import { createGetPgPoolFn } from "../config/createGateways";
import { createUowPerformer } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeConventionReminder = () => {
  logger.info("Starting convention reminder script");
  const timeGateway = new RealTimeGateway();

  return new ConventionsReminder(
    createUowPerformer(config, createGetPgPoolFn(config)).uowPerformer,
    timeGateway,
    makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new UuidV4Generator(),
    }),
  ).execute();
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "conventionReminderScript",
  config,
  executeConventionReminder,
  ({ success, failures }) => {
    const reportLines = [
      `Total of reminders : ${success + failures.length}`,
      `Number of successfully reminders : ${success}`,
      `Number of failures : ${failures.length}`,
      ...(failures.length > 0
        ? [
            `Failures : \n${failures
              .map(({ id, error }) => `  - For immersion id ${id} : ${error}`)
              .join("\n")}`,
          ]
        : []),
    ];
    return reportLines.filter(filterNotFalsy).join("\n");
  },
  logger,
);
