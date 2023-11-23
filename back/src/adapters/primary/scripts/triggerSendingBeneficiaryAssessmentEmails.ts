import { Pool } from "pg";
import { keys } from "ramda";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../../domain/generic/notifications/entities/Notification";
import { SendBeneficiariesPdfAssessmentsEmails } from "../../../domain/offer/useCases/SendBeneficiariesPdfAssessmentsEmails";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { AppConfig } from "../config/appConfig";
import { createUowPerformer } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const sendBeneficiaryAssessmentEmailsScript = async () => {
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

  const sendBeneficiariesAssesmentsEmails =
    new SendBeneficiariesPdfAssessmentsEmails(
      uowPerformer,
      saveNotificationAndRelatedEvent,
      timeGateway,
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
    );

  return sendBeneficiariesAssesmentsEmails.execute();
};

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "sendBeneficiaryAssessmentEmailsScript",
  config,
  sendBeneficiaryAssessmentEmailsScript,
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
