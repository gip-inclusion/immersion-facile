import { Pool } from "pg";
import { ConventionsReminder } from "../../../domain/convention/useCases/ConventionsReminder";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { AppConfig } from "../config/appConfig";
import { createUowPerformer } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const executeConventionReminder = () => {
  logger.info("Starting convention reminder script");
  const timeGateway = new RealTimeGateway();
  const { uowPerformer } = createUowPerformer(
    config,
    () =>
      new Pool({
        connectionString: config.pgImmersionDbUrl,
      }),
  );
  return new ConventionsReminder(
    uowPerformer,
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
    return reportLines
      .filter((reportLine): reportLine is string => !!reportLine)
      .join("\n");
  },
  logger,
);
