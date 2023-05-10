import { addMonths } from "date-fns";
import { Pool } from "pg";
import { immersionFacileContactEmail, SiretDto } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { SuggestEditFormEstablishment } from "../../../domain/immersionOffer/useCases/SuggestEditFormEstablishment";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { InMemoryEmailGateway } from "../../secondary/emailGateway/InMemoryEmailGateway";
import { SendinblueHtmlEmailGateway } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway";
import { sendinblueHtmlEmailGatewayTargets } from "../../secondary/emailGateway/SendinblueHtmlEmailGateway.targets";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { AppConfig, makeEmailAllowListPredicate } from "../config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../config/createHttpClientForExternalApi";
import { makeGenerateEditFormEstablishmentUrl } from "../config/magicLinkUrl";
import { createPgUow } from "../config/uowConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const NB_MONTHS_BEFORE_SUGGEST = 6;

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();

type Report = {
  numberOfEstablishmentsToContact: number;
  errors?: Record<SiretDto, any>;
};

const triggerSuggestEditFormEstablishmentEvery6Months =
  async (): Promise<Report> => {
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
        `SELECT DISTINCT siret FROM establishments WHERE update_date < $1 
          AND siret NOT IN (
            SELECT payload ->> 'siret' as siret  FROM outbox WHERE topic='FormEstablishmentEditLinkSent' 
            AND occurred_at > $2)`,
        [since, since],
      )
    ).rows.map(({ siret }) => siret);

    if (establishmentsToContact.length === 0)
      return { numberOfEstablishmentsToContact: 0 };

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
      config.emailGateway === "SENDINBLUE_HTML"
        ? new SendinblueHtmlEmailGateway(
            configureCreateHttpClientForExternalApi()(
              sendinblueHtmlEmailGatewayTargets,
            ),
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

    const generateEditEstablishmentJwt =
      makeGenerateJwtES256<"editEstablishment">(
        config.jwtPrivateKey,
        3600 * 24,
      );
    const suggestEditFormEstablishment = new SuggestEditFormEstablishment(
      pgUowPerformer,
      emailGateway,
      timeGateway,
      makeGenerateEditFormEstablishmentUrl(
        config,
        generateEditEstablishmentJwt,
      ),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new UuidV4Generator(),
      }),
    );

    const errors: Record<SiretDto, any> = {};

    await Promise.all(
      establishmentsToContact.map(async (siret) => {
        await suggestEditFormEstablishment
          .execute(siret)
          .catch((error: any) => {
            errors[siret] = error;
          });
      }),
    );

    return {
      numberOfEstablishmentsToContact: establishmentsToContact.length,
      errors,
    };
  };

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "triggerSuggestEditFormEstablishmentEvery6Months",
  config,
  triggerSuggestEditFormEstablishmentEvery6Months,
  ({ numberOfEstablishmentsToContact, errors = {} }) => {
    const nSiretFailed = Object.keys(errors).length;
    const nSiretSuccess = numberOfEstablishmentsToContact - nSiretFailed;
    const errorsAsString = Object.keys(errors)
      .map((siret) => `For siret ${siret} : ${errors[siret]} `)
      .join("\n");

    return [
      `Successfully sent to ${nSiretSuccess} sirets`,
      `Number of failures: ${nSiretFailed}`,
      ...(nSiretFailed > 0 ? [`Errors were: ${errorsAsString}`] : []),
    ].join("\n");
  },
);
