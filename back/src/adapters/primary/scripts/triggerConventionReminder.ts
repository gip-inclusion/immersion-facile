import { filterNotFalsy } from "shared";
import { ConventionsReminder } from "../../../domain/convention/useCases/ConventionsReminder";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { RealTimeGateway } from "../../../domain/core/time-gateway/adapters/RealTimeGateway";
import { createLogger } from "../../../utils/logger";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
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
