import { subMonths } from "date-fns";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { makeMarkOldConventionAsDeprecated } from "../domains/convention/MarkOldConventionAsDeprecated";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const triggerMarkOldConventionAsDeprecated = async () => {
  const deprecateSince = subMonths(new Date(), 1);

  const { numberOfUpdatedConventions } =
    await makeMarkOldConventionAsDeprecated({
      uowPerformer: createUowPerformer(config, createGetPgPoolFn(config))
        .uowPerformer,
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway: new RealTimeGateway(),
          uuidGenerator: new UuidV4Generator(),
        }),
      },
    }).execute({
      deprecateSince,
    });

  return { numberOfUpdatedConventions };
};

handleCRONScript(
  "triggerMarkOldConventionAsDeprecated",
  config,
  triggerMarkOldConventionAsDeprecated,
  ({ numberOfUpdatedConventions }) =>
    `Marked ${numberOfUpdatedConventions} as deprecated`,
  logger,
);
