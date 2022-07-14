import { Pool } from "pg";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueEmailGateway } from "../../secondary/emailGateway/SendinblueEmailGateway";
import { AppConfig } from "../config/appConfig";
import { makeEmailAllowListPredicate } from "../config/createGateways";
import { createGenerateConventionMagicLink } from "../config/createGenerateConventionMagicLink";
import { createUowPerformer } from "../config/uowConfig";

const sendEmailsWithAssessmentCreationLinkScript = async () => {
  const config = AppConfig.createFromEnv();

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const clock = new RealClock();

  const emailGateway =
    config.emailGateway === "SENDINBLUE"
      ? SendinblueEmailGateway.create(
          config.sendinblueApiKey,
          makeEmailAllowListPredicate({
            skipEmailAllowList: config.skipEmailAllowlist,
            emailAllowList: config.emailAllowList,
          }),
        )
      : new InMemoryEmailGateway(clock);

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const sendEmailsWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      uowPerformer,
      emailGateway,
      clock,
      createGenerateConventionMagicLink(config),
      makeCreateNewEvent({ clock, uuidGenerator: new UuidV4Generator() }),
    );

  await sendEmailsWithAssessmentCreationLink.execute();
};

/* eslint-disable no-console */
sendEmailsWithAssessmentCreationLinkScript()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed with error : ", error);
    process.exit(1);
  });
