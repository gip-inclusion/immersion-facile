import axios from "axios";
import { Pool } from "pg";
import { immersionFacileContactEmail } from "shared";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueHtmlEmailGateway } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway";
import { AppConfig, makeEmailAllowListPredicate } from "../config/appConfig";
import { createGenerateConventionMagicLink } from "../config/createGenerateConventionMagicLink";
import { createUowPerformer } from "../config/uowConfig";
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

  const sendEmailsWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      uowPerformer,
      emailGateway,
      timeGateway,
      createGenerateConventionMagicLink(config),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
    );

  await sendEmailsWithAssessmentCreationLink.execute();
};

/* eslint-disable no-console */
sendEmailsWithAssessmentCreationLinkScript()
  .then(() => {
    logger.info("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Script failed with error : ", error);
    process.exit(1);
  });
