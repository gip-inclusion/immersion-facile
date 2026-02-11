import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeGetOldConventionDraftsAndEmitDeleteEvent } from "../../domains/convention/use-cases/GetOldConventionDraftsAndEmitDeleteEvent";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { CustomTimeGateway } from "../../domains/core/time-gateway/adapters/CustomTimeGateway";
import { createInMemoryUow } from "../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../domains/core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { monitoredAsUseCase } from "../utils";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const deleteOldConventionDrafts = async (): Promise<{
  numberOfConventionDraftsDeleted: number;
}> => {
  const uow = createInMemoryUow();
  const timeGateway = new CustomTimeGateway();
  const uuidGenerator = new TestUuidGenerator();
  const createNewEvent = makeCreateNewEvent({
    timeGateway,
    uuidGenerator,
  });

  const getOldConventionDraftsAndEmitDeleteEvent =
    makeGetOldConventionDraftsAndEmitDeleteEvent({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        createNewEvent,
      },
    });

  const { numberOfOldConventionDraftIds } =
    await getOldConventionDraftsAndEmitDeleteEvent.execute();

  return {
    numberOfConventionDraftsDeleted: numberOfOldConventionDraftIds,
  };
};

export const triggerDeleteOldConventionDrafts = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerDeleteOldConventionDrafts",
    config,
    script: monitoredAsUseCase({
      name: "DeleteOldConventionDrafts",
      cb: deleteOldConventionDrafts,
    }),
    handleResults: ({ numberOfConventionDraftsDeleted }) =>
      `${numberOfConventionDraftsDeleted} convention drafts were deleted`,
    logger,
    exitOnFinish,
  });
