import { filterNotFalsy } from "shared";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { ConventionsReminder } from "../../domains/convention/use-cases/ConventionsReminder";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { RealTimeGateway } from "../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { configureSentry } from "../configureSentry";
import { handleCRONScript } from "../handleCRONScript";

const config = AppConfig.createFromEnv();
configureSentry(config.envType, { traceRate: 1 }); // it is a CRON, we want to trace all the time for debug.

const logger = createLogger(__filename);

const executeConventionReminder = () => {
  logger.info({ message: "Starting convention reminder script" });
  const timeGateway = new RealTimeGateway();

  return new ConventionsReminder(
    createDbRelatedSystems(config, createMakeProductionPgPool(config))
      .uowPerformer,
    timeGateway,
    makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new UuidV4Generator(),
    }),
  ).execute();
};

export const triggerConventionReminder = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "conventionReminderScript",
    config,
    script: executeConventionReminder,
    handleResults: ({ success, failures }) => {
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
    exitOnFinish,
  });
