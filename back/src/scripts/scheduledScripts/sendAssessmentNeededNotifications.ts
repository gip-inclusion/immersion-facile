import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { keys } from "ramda";
import type { DateRange } from "shared";
import { AppConfig } from "../../config/bootstrap/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../../config/bootstrap/magicLinkUrl";
import { makeKyselyDb } from "../../config/pg/kysely/kyselyUtils";
import { createMakeProductionPgPool } from "../../config/pg/pgPool";
import { PgAssessmentRepository } from "../../domains/convention/adapters/PgAssessmentRepository";
import { PgConventionQueries } from "../../domains/convention/adapters/PgConventionQueries";
import { makeCreateNewEvent } from "../../domains/core/events/ports/EventBus";
import { makeGenerateJwtES256 } from "../../domains/core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../domains/core/notifications/helpers/Notification";
import { NanoIdShortLinkIdGeneratorGateway } from "../../domains/core/short-link/adapters/short-link-generator-gateway/NanoIdShortLinkIdGeneratorGateway";
import { RealTimeGateway } from "../../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendAssessmentNeededNotifications } from "../../domains/establishment/use-cases/SendAssessmentNeededNotifications";
import { createLogger } from "../../utils/logger";
import { handleCRONScript } from "../handleCRONScript";
import { getDateRangeFromScriptParams } from "../utils";

/**
 *  we can pass date params to this script like this: pnpm back trigger-sending-emails-with-assessment-creation-link 2024-07-01 2024-01-24
 */

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const sendAssessmentNeededNotificationsScript = async () => {
  logger.info({ message: "Starting to send emails with assessment link" });

  const timeGateway = new RealTimeGateway();
  const now = timeGateway.now();
  const todayAndAround = {
    from: subDays(now, 1),
    to: addDays(now, 1),
  };
  const conventionFinishingRange: DateRange =
    getDateRangeFromScriptParams({
      scriptParams: process.argv,
    }) ?? todayAndAround;

  if (conventionFinishingRange.to > addDays(now, 1)) {
    const message =
      "Attention, vous êtes sur le point d'envoyer des bilans concernant des immersions qui ne seront pas terminées demain.";
    logger.error({
      message,
    });
    throw new Error(message);
  }

  const getPgPool = createMakeProductionPgPool(config);

  const { uowPerformer } = createUowPerformer(config, getPgPool);

  const pgPool = getPgPool();
  const kyselyDb = makeKyselyDb(pgPool);
  const conventionQueries = new PgConventionQueries(kyselyDb);
  const assessmentRepository = new PgAssessmentRepository(kyselyDb);

  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );
  const uuidGenerator = new UuidV4Generator();

  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    timeGateway,
  );

  const sendAssessmentNeededNotifications =
    new SendAssessmentNeededNotifications(
      uowPerformer,
      { conventionQueries, assessmentRepository },
      saveNotificationAndRelatedEvent,
      timeGateway,
      makeGenerateConventionMagicLinkUrl(config, generateConventionJwt),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
      config,
      new NanoIdShortLinkIdGeneratorGateway(),
    );

  const result = await sendAssessmentNeededNotifications.execute({
    conventionEndDate: conventionFinishingRange,
  });

  await pgPool.end();

  return result;
};

export const triggerSendAssessmentNeededNotifications = ({
  exitOnFinish,
}: {
  exitOnFinish: boolean;
}) =>
  handleCRONScript({
    name: "sendAssessmentNeededNotificationsScript",
    config,
    script: sendAssessmentNeededNotificationsScript,
    handleResults: ({
      conventionsQtyWithImmersionEnding,
      conventionsQtyWithAlreadyExistingAssessment,
      conventionsQtyWithAssessmentSentSuccessfully,
      conventionsAssessmentSentErrored = {},
    }) => {
      const failures = keys(conventionsAssessmentSentErrored);
      const numberOfFailures = failures.length;
      const numberOfSuccess = conventionsQtyWithAssessmentSentSuccessfully;

      const errorsAsString = failures
        .map(
          (conventionId) =>
            `For immersion ids ${conventionId} : ${conventionsAssessmentSentErrored[conventionId]} `,
        )
        .join("\n");

      return [
        `Total of immersion ending tomorrow : ${conventionsQtyWithImmersionEnding}`,
        `Number of conventions with already existing assessment : ${conventionsQtyWithAlreadyExistingAssessment}`,
        `Number of successfully sent Assessments : ${numberOfSuccess}`,
        `Number of failures : ${numberOfFailures}`,
        ...(numberOfFailures > 0 ? [`Failures : ${errorsAsString}`] : []),
      ].join("\n");
    },
    logger,
    exitOnFinish,
  });
