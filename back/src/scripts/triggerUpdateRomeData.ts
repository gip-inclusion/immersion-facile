import { sql } from "kysely";
import { Pool } from "pg";
import { map, splitEvery } from "ramda";
import { pipeWithValue, removeDiacritics, sleep } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeConnectedRedisClient } from "../config/bootstrap/cache";
import { type KyselyDb, makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import {
  type AppellationWithShortLabel,
  HttpRome4Gateway,
  makeRome4Routes,
} from "../domains/agency/adapters/ft-agencies-referential/HttpRome4Gateway";
import { createFranceTravailRoutes } from "../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../domains/convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { makeRedisWithCache } from "../domains/core/caching-gateway/adapters/makeRedisWithCache";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { makeAxiosInstances } from "../utils/axiosUtils";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const removeAccentsAndParenthesis = (str: string) =>
  removeDiacritics(str).replace(/[()[\]]/g, "");

const main = async () => {
  const redisClient = await makeConnectedRedisClient(config);
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const db = makeKyselyDb(pool, { skipErrorLog: true });

  const withCache = makeRedisWithCache({
    defaultCacheDurationInHours: 1,
    redisClient,
  });

  const franceTravailRoutes = createFranceTravailRoutes({
    ftApiUrl: config.ftApiUrl,
    ftEnterpriseUrl: config.ftEnterpriseUrl,
  });

  const franceTravailGateway = new HttpFranceTravailGateway(
    createAxiosSharedClient(
      franceTravailRoutes,
      makeAxiosInstances(config.externalAxiosTimeout).axiosWithValidateStatus,
    ),
    withCache,
    config.ftApiUrl,
    config.franceTravailAccessTokenConfig,
    noRetries,
    franceTravailRoutes,
  );

  const httpRome4Gateway = new HttpRome4Gateway(
    createAxiosSharedClient(
      makeRome4Routes(config.ftApiUrl),
      makeAxiosInstances(config.externalAxiosTimeout)
        .axiosWithoutValidateStatus,
    ),
    franceTravailGateway,
    config.franceTravailClientId,
  );

  const numberOfRomes = await db.transaction().execute(async (trx) => {
    const romes = await httpRome4Gateway.getAllRomes();
    await trx
      .insertInto("public_romes_data")
      .values(
        romes.map(({ romeCode, romeLabel }) => ({
          code_rome: romeCode,
          libelle_rome: romeLabel,
          libelle_rome_tsvector: sql`to_tsvector('french', ${romeLabel} )`,
        })),
      )
      .onConflict((oc) =>
        oc.column("code_rome").doUpdateSet(({ ref }) => ({
          libelle_rome: ref("excluded.libelle_rome"),
          libelle_rome_tsvector: sql`to_tsvector
              ('french', ${ref("excluded.libelle_rome")})`,
        })),
      )
      .execute();
    return romes.length;
  });

  await sleep(1000);

  const numberOfAppellations = await db.transaction().execute(async (trx) => {
    const appellations = await httpRome4Gateway.getAllAppellations();
    await Promise.all(
      pipeWithValue(
        appellations,
        splitEvery(5000),
        map(insertAppellations(trx)),
      ),
    );
    return appellations.length;
  });

  pool.end();

  return {
    numberOfRomes,
    numberOfAppellations,
  };
};

const insertAppellations =
  (db: KyselyDb) => (appellations: AppellationWithShortLabel[]) =>
    db
      .insertInto("public_appellations_data")
      .values(
        appellations.map(
          ({
            appellationCode,
            appellationLabel,
            appellationLabelShort,
            romeCode,
          }) => {
            const labelWithoutSpecialCharacters =
              removeAccentsAndParenthesis(appellationLabel);
            return {
              ogr_appellation: Number.parseInt(appellationCode, 10),
              code_rome: romeCode,
              libelle_appellation_long: appellationLabel,
              libelle_appellation_long_without_special_char:
                labelWithoutSpecialCharacters,
              libelle_appellation_long_tsvector: sql`to_tsvector('french', ${labelWithoutSpecialCharacters} )`,
              libelle_appellation_court: appellationLabelShort,
            };
          },
        ),
      )
      .onConflict((oc) =>
        oc.column("ogr_appellation").doUpdateSet(({ ref }) => ({
          code_rome: ref("excluded.code_rome"),
          libelle_appellation_long: ref("excluded.libelle_appellation_long"),
          libelle_appellation_long_without_special_char: ref(
            "excluded.libelle_appellation_long_without_special_char",
          ),
          libelle_appellation_long_tsvector: ref(
            "excluded.libelle_appellation_long_tsvector",
          ),
          libelle_appellation_court: ref("excluded.libelle_appellation_court"),
        })),
      )
      .execute();

handleCRONScript(
  "update-rome-data-from-france-travail-ROME-4-api",
  config,
  main,
  ({ numberOfAppellations, numberOfRomes }) =>
    [
      "Updated successfully rome and appellations data from ROME-4 API",
      `Number of romes: ${numberOfRomes}`,
      `Number of appellations: ${numberOfAppellations}`,
    ].join("\n"),
  logger,
  {
    schedule: { type: "interval", unit: "month", value: 1 },
    checkinMargin: 2 * 24 * 60, // 2 days margin
  },
);
