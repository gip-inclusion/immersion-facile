import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { makeWarnInactiveUsers } from "../../domains/core/authentication/connected-user/use-cases/WarnInactiveUsers";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../domains/core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const _warnInactiveUsersScript = async () => {
  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  const warnInactiveUsers = makeWarnInactiveUsers({
    uowPerformer,
    deps: {
      saveNotificationsBatchAndRelatedEvent:
        makeSaveNotificationsBatchAndRelatedEvent(
          new UuidV4Generator(),
          new CustomTimeGateway(),
        ),
      timeGateway: new CustomTimeGateway(),
      immersionBaseUrl: config.immersionFacileBaseUrl,
    },
  });

  return await warnInactiveUsers.execute();
};

export const triggerWarnInactiveUsers = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "warnInactiveUsers",
    config,
    // script: _warnInactiveUsersScript,
    script: async () => {
      logger.warn({
        message:
          "⚠️THIS IS NOT YET RUN in Production️ ⚠️, edit 'scheduledScripts/warnInactiveUsers.ts' when the deleting usecases are implemented",
      });
      return { numberOfWarningsSent: 0 };
    },
    handleResults: ({ numberOfWarningsSent }) =>
      `Number of account deletion warnings sent : ${numberOfWarningsSent}`,
    logger,
    exitOnFinish,
  });
