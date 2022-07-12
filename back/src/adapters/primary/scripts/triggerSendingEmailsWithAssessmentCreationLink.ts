import { Pool } from "pg";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { PgConventionQueries } from "../../secondary/pg/PgConventionQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { SendinblueEmailGateway } from "../../secondary/emailGateway/SendinblueEmailGateway";
import { AppConfig } from "../config/appConfig";
import { createGenerateConventionMagicLink } from "../config/createGenerateConventionMagicLink";
import { makeEmailAllowListPredicate } from "../config/repositoriesConfig";

const sendEmailsWithAssessmentCreationLinkScript = async () => {
  const config = AppConfig.createFromEnv();

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();
  const outboxRepository = new PgOutboxRepository(client);
  const conventionQueries = new PgConventionQueries(client);
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

  const sendEmailsWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      outboxRepository,
      conventionQueries,
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
