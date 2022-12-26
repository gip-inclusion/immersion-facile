import axios from "axios";
import { addMonths } from "date-fns";
import { Pool } from "pg";
import { immersionFacileContactEmail, SiretDto } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SuggestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/SuggestEditFormEstablishment";
import { createLogger } from "../../../utils/logger";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { AppConfig, makeEmailAllowListPredicate } from "../config/appConfig";
import { makeGenerateEditFormEstablishmentUrl } from "../config/makeGenerateEditFormEstablishmentUrl";
import { createPgUow } from "../config/uowConfig";
import { SendinblueHtmlEmailGateway } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";

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
  const timeGateway = new RealTimeGateway();

  const since = addMonths(timeGateway.now(), -NB_MONTHS_BEFORE_SUGGEST);

  const establishmentsToContact = (
    await client.query(
      `SELECT DISTINCT siret FROM establishments WHERE data_source = 'form' AND update_date < $1 
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

  const suggestEditFormEstablishment = new SuggestEditFormEstablishment(
    pgUowPerformer,
    emailGateway,
    timeGateway,
    makeGenerateEditFormEstablishmentUrl(config),
    makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new UuidV4Generator(),
    }),
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

triggerSuggestEditFormEstablishmentEvery6Months().then(
  () => {
    logger.info(`Script finished success`);
    process.exit(0);
  },
  (error: any) => {
    logger.error(error, `Script failed`);
    process.exit(1);
  },
);
