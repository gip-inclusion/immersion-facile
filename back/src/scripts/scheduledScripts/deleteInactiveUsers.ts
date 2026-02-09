import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { makeTriggerEventsToDeleteInactiveUsers } from "../../domains/core/authentication/connected-user/use-cases/TriggerEventsToDeleteInactiveUsers";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { CustomTimeGateway } from "../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const triggerEventsToDeleteInactiveUsersScript = async () => {
  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  const timeGateway = new CustomTimeGateway();
  const uuidGenerator = new UuidV4Generator();

  const triggerEventsToDeleteInactiveUsers =
    makeTriggerEventsToDeleteInactiveUsers({
      uowPerformer,
      deps: {
        timeGateway,
        createNewEvent: makeCreateNewEvent({ timeGateway, uuidGenerator }),
      },
    });

  return await triggerEventsToDeleteInactiveUsers.execute();
};

export const triggerDeleteInactiveUsers = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerEventsToDeleteInactiveUsers",
    config,
    script: triggerEventsToDeleteInactiveUsersScript,
    handleResults: ({ numberOfDeletionsTriggered }) =>
      `Number of deletions triggered: ${numberOfDeletionsTriggered}`,
    logger,
    exitOnFinish,
  });
