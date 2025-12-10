import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { makeRemindAgencyAdminThatNewUserRequestAgencyRight } from "../../domains/convention/use-cases/RemindAgencyAdminThatNewUserRequestAgencyRight";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../domains/core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const remindAgencyAdminThatNewUserRequestAgencyRightScript = async () => {
  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  const remindAgencyAdminThatNewUserRequestAgencyRight =
    makeRemindAgencyAdminThatNewUserRequestAgencyRight({
      uowPerformer,
      deps: {
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(
            new UuidV4Generator(),
            new CustomTimeGateway(),
          ),
        immersionBaseUrl: config.immersionFacileBaseUrl,
      },
    });

  const result = await remindAgencyAdminThatNewUserRequestAgencyRight.execute();
  return result;
};

export const triggerRemindAgencyAdminThatNewUserRequestAgencyRight = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "remindAgencyAdminThatNewUserRequestAgencyRight",
    config,
    script: remindAgencyAdminThatNewUserRequestAgencyRightScript,
    handleResults: ({ remindersSent }) =>
      `Number of reminders sent successfully : ${remindersSent}`,
    logger,
    exitOnFinish,
  });
