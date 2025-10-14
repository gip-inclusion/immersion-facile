import { AppConfig } from "../config/bootstrap/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../config/bootstrap/magicLinkUrl";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeProductionPgPool } from "../config/pg/pgPool";
import { PgAssessmentRepository } from "../domains/convention/adapters/PgAssessmentRepository";
import { makeGenerateJwtES256 } from "../domains/core/jwt";
import { PgNotificationRepository } from "../domains/core/notifications/adapters/PgNotificationRepository";
import { makeSaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import { NanoIdShortLinkIdGeneratorGateway } from "../domains/core/short-link/adapters/short-link-generator-gateway/NanoIdShortLinkIdGeneratorGateway";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { makeAssessmentReminder } from "../domains/establishment/use-cases/AssessmentReminder";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const triggerAssessmentReminder = async () => {
  logger.info({ message: "Starting to send emails with assessment reminder" });
  const shortLinkIdGeneratorGateway = new NanoIdShortLinkIdGeneratorGateway();
  const timeGateway = new RealTimeGateway();
  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );

  const pgPool = createMakeProductionPgPool(config)();
  const kyselyDb = makeKyselyDb(pgPool);

  const outOfTrx = {
    assessmentRepository: new PgAssessmentRepository(kyselyDb),
    notificationRepository: new PgNotificationRepository(kyselyDb),
  };

  const { numberOfConventionsReminded: numberOfConventionsReminded3DaysAfter } =
    await makeAssessmentReminder({
      uowPerformer: createUowPerformer(
        config,
        createMakeProductionPgPool(config),
      ).uowPerformer,
      deps: {
        outOfTrx,
        timeGateway,
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          new UuidV4Generator(),
          timeGateway,
        ),
        generateConventionMagicLinkUrl: makeGenerateConventionMagicLinkUrl(
          config,
          generateConventionJwt,
        ),
        shortLinkIdGeneratorGateway,
        config,
      },
    }).execute({ mode: "3daysAfterInitialAssessmentEmail" });

  const {
    numberOfConventionsReminded: numberOfConventionsReminded10DaysAfter,
  } = await makeAssessmentReminder({
    uowPerformer: createUowPerformer(config, createMakeProductionPgPool(config))
      .uowPerformer,
    deps: {
      outOfTrx,
      timeGateway,
      saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
        new UuidV4Generator(),
        timeGateway,
      ),
      generateConventionMagicLinkUrl: makeGenerateConventionMagicLinkUrl(
        config,
        generateConventionJwt,
      ),
      shortLinkIdGeneratorGateway,
      config,
    },
  }).execute({ mode: "10daysAfterInitialAssessmentEmail" });

  await pgPool.end();

  return {
    numberOfConventionsReminded3DaysAfter,
    numberOfConventionsReminded10DaysAfter,
  };
};

handleCRONScript({
  name: "assessmentReminder",
  config,
  script: triggerAssessmentReminder,
  handleResults: ({
    numberOfConventionsReminded3DaysAfter,
    numberOfConventionsReminded10DaysAfter,
  }) =>
    [
      `Total of reminders D+3 : ${numberOfConventionsReminded3DaysAfter}`,
      `Total of reminders D+10 : ${numberOfConventionsReminded10DaysAfter}`,
    ].join("\n"),
  logger,
});
