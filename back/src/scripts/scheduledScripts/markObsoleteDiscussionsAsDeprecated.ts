import { AppConfig } from "../../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createDbRelatedSystems } from "../../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { makeGetObsoleteDiscussionsAndEmitDeprecatedEvent } from "../../domains/establishment/use-cases/discussions/GetObsoleteDiscussionsAndEmitDeprecatedEvents";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const markObsoleteDiscussionsAsDeprecated = async () => {
  const { uowPerformer } = createDbRelatedSystems(
    config,
    createMakeProductionPgPool(config),
  );

  const uuidGenerator = new UuidV4Generator();
  const timeGateway = new RealTimeGateway();
  const createNewEvent = makeCreateNewEvent({
    timeGateway,
    uuidGenerator,
  });

  const getObsoleteDiscussionsAndEmitDeprecatedEvent =
    makeGetObsoleteDiscussionsAndEmitDeprecatedEvent({
      uowPerformer,
      deps: {
        timeGateway,
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          uuidGenerator,
          timeGateway,
        ),
        createNewEvent,
      },
    });

  return getObsoleteDiscussionsAndEmitDeprecatedEvent.execute();
};

export const triggerMarkObsoleteDiscussionsAsDeprecated = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerMarkObsoleteDiscussionsAsDeprecated",
    config,
    script: markObsoleteDiscussionsAsDeprecated,
    handleResults: ({ numberOfObsoleteDiscussions }) =>
      `Marked ${numberOfObsoleteDiscussions} discussions as deprecated`,
    logger,
    exitOnFinish,
  });
