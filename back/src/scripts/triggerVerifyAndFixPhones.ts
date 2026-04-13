import { subDays } from "date-fns";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
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
      deps: { createNewEvent, timeGateway, uowPerformer },
    });

  const oneDayAgo = subDays(timeGateway.now(), 1);
  return await verifyAndRequestInvalidPhonesUpdate.execute({
    dateToVerifyBefore: oneDayAgo,
  });
};

const triggerVerifyAndFixPhones = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "triggerVerifyAndFixPhones",
    config,
    script: verifyAndFixPhones,
    handleResults: (report) =>
      `Verify and fix phones report : \nCorrect phones:${report.nbOfCorrectPhones} \nFixed phones:${report.nbOfFixedPhones} \nPhones set to default:${report.nbOfPhonesSetToDefault}`,
    logger,
    exitOnFinish,
  });

triggerVerifyAndFixPhones({ exitOnFinish: true });
