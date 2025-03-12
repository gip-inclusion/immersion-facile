import { addDays } from "date-fns";
import subDays from "date-fns/subDays";
import { keys } from "ramda";
import type { DateRange } from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createGetPgPoolFn } from "../config/bootstrap/createGateways";
import { makeGenerateConventionMagicLinkUrl } from "../config/bootstrap/magicLinkUrl";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import { makeGenerateJwtES256 } from "../domains/core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendAssessmentNeededNotifications } from "../domains/establishment/use-cases/SendAssessmentNeededNotifications";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";
import { getDateRangeFromScriptParams } from "./utils";

/**
 *  we can pass date params to this script like this: pnpm back trigger-sending-emails-with-assessment-creation-link 2024-07-01 2024-01-24
 */

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const sendAssessmentFormNotificationsScript = async () => {
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

  const { uowPerformer } = createUowPerformer(
    config,
    createGetPgPoolFn(config),
  );

  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );
  const uuidGenerator = new UuidV4Generator();

  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    timeGateway,
  );

  const sendAssessmentFormNotifications = new SendAssessmentNeededNotifications(
    uowPerformer,
    saveNotificationAndRelatedEvent,
    timeGateway,
    makeGenerateConventionMagicLinkUrl(config, generateConventionJwt),
    makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new UuidV4Generator(),
    }),
  );

  return sendAssessmentFormNotifications.execute({
    conventionEndDate: conventionFinishingRange,
  });
};

handleCRONScript(
  "sendAssessmentFormNotificationsScript",
  config,
  sendAssessmentFormNotificationsScript,
  ({ numberOfImmersionEndingTomorrow, errors = {} }) => {
    const failures = keys(errors);
    const numberOfFailures = failures.length;
    const numberOfSuccess = numberOfImmersionEndingTomorrow - numberOfFailures;

    const errorsAsString = failures
      .map(
        (conventionId) =>
          `For immersion ids ${conventionId} : ${errors[conventionId]} `,
      )
      .join("\n");

    return [
      `Total of immersion ending tomorrow : ${numberOfSuccess}`,
      `Number of successfully sent Assessments : ${numberOfSuccess}`,
      `Number of failures : ${numberOfFailures}`,
      ...(numberOfFailures > 0 ? [`Failures : ${errorsAsString}`] : []),
    ].join("\n");
  },
  logger,
);
