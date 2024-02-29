import { Pool } from "pg";
import { keys } from "ramda";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../config/bootstrap/magicLinkUrl";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import { makeGenerateJwtES256 } from "../domains/core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendEmailsWithAssessmentCreationLink } from "../domains/establishment/use-cases/SendEmailsWithAssessmentCreationLink";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const sendEmailsWithAssessmentCreationLinkScript = async () => {
  logger.info("Starting to send Emails with assessment link");

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const timeGateway = new RealTimeGateway();

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );
  const uuidGenerator = new UuidV4Generator();

  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    timeGateway,
  );

  const sendEmailsWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      uowPerformer,
      saveNotificationAndRelatedEvent,
      timeGateway,
      makeGenerateConventionMagicLinkUrl(config, generateConventionJwt),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
    );

  return sendEmailsWithAssessmentCreationLink.execute();
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "sendEmailsWithAssessmentCreationLinkScript",
  config,
  sendEmailsWithAssessmentCreationLinkScript,
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
