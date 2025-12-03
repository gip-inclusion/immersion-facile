import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { RemindAgencyAdminThatNewUserRequestAgencyRight } from "../../domains/convention/use-cases/RemindAgencyAdminThatNewUserRequestAgencyRight";
import { makeSaveNotificationAndRelatedEvent } from "../../domains/core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const remindAgencyAdminThatNewUserRequestAgencyRightScript = async () => {
  logger.info({
    message:
      "Starting remind agency admin that new user request agency right script",
  });

  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  const remindAgencyAdminThatNewUserRequestAgencyRight =
    new RemindAgencyAdminThatNewUserRequestAgencyRight(
      uowPerformer,
      makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        new CustomTimeGateway(),
      ),
    );

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
    handleResults: ({ remindersSent, failures }) => {
      const numberOfFailures = failures.length;
      const errorsAsString = failures
        .map(
          (failure) =>
            `For user id ${failure.userId} : ${failure.error.message}`,
        )
        .join("\n");

      return [
        `Number of reminders sent successfully : ${remindersSent}`,
        `Number of failures : ${numberOfFailures}`,
        ...(numberOfFailures > 0 ? [`Failures : \n${errorsAsString}`] : []),
      ].join("\n");
    },
    logger,
    exitOnFinish,
  });
