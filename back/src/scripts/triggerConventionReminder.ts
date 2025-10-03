import { filterNotFalsy } from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { ConventionsReminder } from "../domains/convention/use-cases/ConventionsReminder";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeConventionReminder = () => {
  logger.info({ message: "Starting convention reminder script" });
  const timeGateway = new RealTimeGateway();

  return new ConventionsReminder(
    createUowPerformer(config, createMakeProductionPgPool(config)).uowPerformer,
    timeGateway,
    makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new UuidV4Generator(),
    }),
  ).execute();
};

handleCRONScript(
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
