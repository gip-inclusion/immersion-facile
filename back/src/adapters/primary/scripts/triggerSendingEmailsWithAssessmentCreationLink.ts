import axios from "axios";
import { Pool } from "pg";
import { keys } from "ramda";
import { immersionFacileContactEmail } from "shared";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueHtmlEmailGateway } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway";
import { AppConfig, makeEmailAllowListPredicate } from "../config/appConfig";
import { makeGenerateConventionMagicLinkUrl } from "../config/magicLinkUrl";
import { createUowPerformer } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const sendEmailsWithAssessmentCreationLinkScript = async () => {
  logger.info("Starting to send Emails with assessment link");
  const config = AppConfig.createFromEnv();

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const timeGateway = new RealTimeGateway();

  const emailGateway =
    config.emailGateway === "SENDINBLUE_HTML"
      ? new SendinblueHtmlEmailGateway(
          axios,
          makeEmailAllowListPredicate({
            skipEmailAllowList: config.skipEmailAllowlist,
            emailAllowList: config.emailAllowList,
          }),
          config.apiKeySendinblue,
          {
            name: "Immersion Facilitée",
            email: immersionFacileContactEmail,
          },
        )
      : new InMemoryEmailGateway(timeGateway);

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const generateConventionJwt = makeGenerateJwtES256<"convention">(
    config.jwtPrivateKey,
    3600 * 24 * 30,
  );

  const sendEmailsWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      uowPerformer,
      emailGateway,
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
      ...(numberOfFailures > 0 ? [`Failures : ${errorsAsString}`] : [""]),
    ].join("\n");
  },
  logger,
);
