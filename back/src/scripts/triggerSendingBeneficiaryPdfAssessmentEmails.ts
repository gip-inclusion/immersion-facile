import { Pool } from "pg";
import { keys } from "ramda";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeCreateNewEvent } from "../domains/core/events/ports/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../domains/core/notifications/helpers/Notification";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createUowPerformer } from "../domains/core/unit-of-work/adapters/createUowPerformer";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SendBeneficiariesPdfAssessmentsEmails } from "../domains/establishment/use-cases/SendBeneficiariesPdfAssessmentsEmails";
import { createLogger } from "../utils/logger";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const sendBeneficiaryPdfAssessmentEmailsScript = async () => {
  logger.info("Starting to send Beneficiary assessment Emails ");

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const timeGateway = new RealTimeGateway();

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const uuidGenerator = new UuidV4Generator();

  const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
    uuidGenerator,
    timeGateway,
  );

  const sendBeneficiariesPdfAssesmentsEmails =
    new SendBeneficiariesPdfAssessmentsEmails(
      uowPerformer,
      saveNotificationAndRelatedEvent,
      timeGateway,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
    );

  return sendBeneficiariesPdfAssesmentsEmails.execute();
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "sendBeneficiaryPdfAssessmentEmailsScript",
  config,
  sendBeneficiaryPdfAssessmentEmailsScript,
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
