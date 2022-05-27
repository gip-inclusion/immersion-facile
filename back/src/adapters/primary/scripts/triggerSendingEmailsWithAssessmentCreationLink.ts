import { Pool } from "pg";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SendEmailsWithAssessmentCreationLink } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/InMemoryEmailGateway";
import { PgImmersionApplicationQueries } from "../../secondary/pg/PgImmersionApplicationQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { SendinblueEmailGateway } from "../../secondary/SendinblueEmailGateway";
import { AppConfig } from "../config/appConfig";
import { makeGenerateCreateAssessmentUrl } from "../config/makeGenerateCreateAssessmentUrl";

const sendEmailsWithAssessmentCreationLinkScript = async () => {
  const config = AppConfig.createFromEnv();

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();
  const outboxRepository = new PgOutboxRepository(client);
  const applicationQueries = new PgImmersionApplicationQueries(client);

  const emailGateway =
    config.emailGateway === "SENDINBLUE"
      ? SendinblueEmailGateway.create(config.sendinblueApiKey)
      : new InMemoryEmailGateway();

  const clock = new RealClock();
  const sendEmailsWithAssessmentCreationLink =
    new SendEmailsWithAssessmentCreationLink(
      outboxRepository,
      applicationQueries,
      emailGateway,
      clock,
      makeGenerateCreateAssessmentUrl(config),
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
