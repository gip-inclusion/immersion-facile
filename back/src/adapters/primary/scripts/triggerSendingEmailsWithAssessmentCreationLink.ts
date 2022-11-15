import axios from "axios";
import { Pool } from "pg";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueHtmlEmailGateway } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway";
import { AppConfig, makeEmailAllowListPredicate } from "../config/appConfig";
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
      ? new SendinblueHtmlEmailGateway(
          axios,
          makeEmailAllowListPredicate({
            skipEmailAllowList: config.skipEmailAllowlist,
            emailAllowList: config.emailAllowList,
          }),
          config.apiKeySendinblue,
          {
            name: "Immersion Facilitée",
            email: "contact@immersion-facile.beta.gouv.fr",
          },
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
