import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import {
  createMakeProductionPgPool,
  createMakeScriptPgPool,
} from "../config/pg/pgPool";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import { makeVerifyAndRequestInvalidPhonesUpdate } from "../domains/core/phone-number/use-cases/VerifyAndRequestInvalidPhonesUpdate";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createDbRelatedSystems } from "../domains/core/unit-of-work/adapters/createDbRelatedSystems";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const verifyAndFixPhones = async () => {
  const pool = createMakeScriptPgPool(config)();
  const kyselyDb = makeKyselyDb(pool);
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

  const verifyAndRequestInvalidPhonesUpdate =
    makeVerifyAndRequestInvalidPhonesUpdate({
      deps: {
        kyselyDb,
        timeGateway,
        createNewEvent,
        uowPerformer,
      },
    });

  return await verifyAndRequestInvalidPhonesUpdate.execute();
};

export const triggerMarkObsoleteDiscussionsAsDeprecated = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerMarkObsoleteDiscussionsAsDeprecated",
    config,
    script: verifyAndFixPhones,
    handleResults: (report) =>
      `Verify and fix phones report : \nCorrect phones:${report.nbOfCorrectPhones} \nFixed phones:${report.nbOfFixedPhones} \nPhones set to default:${report.nbOfPhonesSetToDefault}`,
    logger,
    exitOnFinish,
  });
