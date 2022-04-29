import { addMonths } from "date-fns";
import { Pool } from "pg";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { SuggestEditFormEstablishment } from "../../domain/immersionOffer/useCases/SuggestEditFormEstablishment";
import { SiretDto } from "shared/src/siret";
import { createLogger } from "../../utils/logger";

import { notifyDiscord } from "../../utils/notifyDiscord";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { RealClock } from "../secondary/core/ClockImplementations";
import { UuidV4Generator } from "../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../secondary/InMemoryEmailGateway";
import { PgUowPerformer } from "../secondary/pg/PgUowPerformer";
import { SendinblueEmailGateway } from "../secondary/SendinblueEmailGateway";
import { AppConfig } from "./appConfig";
import { createPgUow, makeGenerateEditFormEstablishmentUrl } from "./config";

const NB_MONTHS_BEFORE_SUGGEST = 6;

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

const triggerSuggestEditFormEstablishmentEvery6Months = async () => {
  logger.info(
    `[triggerSuggestEditFormEstablishmentEvery6Months] Script started.`,
  );

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();
  const clock = new RealClock();

  const since = addMonths(clock.now(), -NB_MONTHS_BEFORE_SUGGEST);

  const establishmentsToContact = (
    await client.query(
      `SELECT DISTINCT siret FROM establishments WHERE data_source = 'form' AND update_date > $1 
          AND siret NOT IN (
            SELECT payload ->> 'siret' as siret  FROM outbox WHERE topic='FormEstablishmentEditLinkSent' 
            AND occurred_at > $2)`,
      [since, since],
    )
  ).rows.map(({ siret }) => siret);

  if (establishmentsToContact.length === 0) return;

  logger.info(
    `[triggerSuggestEditFormEstablishmentEvery6Months] Found ${
      establishmentsToContact.length
    } establishments not updated since ${since} to contact, with siret : ${establishmentsToContact.join(
      ", ",
    )}`,
  );

  const testPool = getTestPgPool();
  const pgUowPerformer = new PgUowPerformer(testPool, createPgUow);

  const emailGateway =
    config.emailGateway === "SENDINBLUE"
      ? SendinblueEmailGateway.create(config.sendinblueApiKey)
      : new InMemoryEmailGateway();

  const suggestEditFormEstablishment = new SuggestEditFormEstablishment(
    pgUowPerformer,
    emailGateway,
    clock,
    makeGenerateEditFormEstablishmentUrl(config),
    makeCreateNewEvent({ clock, uuidGenerator: new UuidV4Generator() }),
  );

  const errors: Record<SiretDto, any> = {};

  await Promise.all(
    establishmentsToContact.map(async (siret) => {
      await suggestEditFormEstablishment.execute(siret).catch((error: any) => {
        errors[siret] = error;
      });
    }),
  );

  const nSiretFailed = Object.keys(errors).length;
  const nSiretSuccess = establishmentsToContact.length - nSiretFailed;

  const scriptSummaryMessage = `[triggerSuggestEditFormEstablishmentEvery6Months] Script summary: Succeed: ${nSiretSuccess}; Failed: ${nSiretFailed}\nErrors were: ${Object.keys(
    errors,
  )
    .map((siret) => `For siret ${siret} : ${errors[siret]} `)
    .join("\n")}`;

  notifyDiscord(scriptSummaryMessage);
  logger.info(scriptSummaryMessage);
};

triggerSuggestEditFormEstablishmentEvery6Months();
