import axios from "axios";
import { Pool } from "pg";
import { map, splitEvery } from "ramda";
import { AppellationCode, RomeCode, pipeWithValue } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AccessTokenResponse, AppConfig } from "../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../config/helpers/createAxiosSharedClients";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
  makeKyselyDb,
} from "../config/pg/kysely/kyselyUtils";
import {
  HttpRome3Gateway,
  makeRome3Routes,
} from "../domains/agency/adapters/pe-agencies-referential/HttpRome3Gateway";
import { HttpPoleEmploiGateway } from "../domains/convention/adapters/pole-emploi-gateway/HttpPoleEmploiGateway";
import { InMemoryCachingGateway } from "../domains/core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const main = async () => {
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const db = makeKyselyDb(pool, { skipErrorLog: true });

  const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
    new RealTimeGateway(),
    "expires_in",
  );

  const franceTravailGateway = new HttpPoleEmploiGateway(
    createPeAxiosSharedClient(config),
    cachingGateway,
    config.peApiUrl,
    config.poleEmploiAccessTokenConfig,
    noRetries,
  );

  const httpRome3Gateway = new HttpRome3Gateway(
    createAxiosSharedClient(makeRome3Routes(config.peApiUrl), axios),
    franceTravailGateway,
    config.poleEmploiClientId,
  );

  const numberOfAppellations = await db.transaction().execute(async (trx) => {
    const appellations = await httpRome3Gateway.getAllAppellations();

    await Promise.all(
      pipeWithValue(
        appellations,
        splitEvery(5000),
        map(updateAppellations(trx)),
      ),
    );

    return appellations.length;
  });

  await pool.end();

  return {
    numberOfAppellations,
  };
};

const updateAppellations =
  (db: KyselyDb) =>
  (appellations: { appellationCode: AppellationCode; romeCode: RomeCode }[]) =>
    executeKyselyRawSqlQuery(
      db,
      `
      WITH appellation_rome_mapping AS (
        SELECT rome_v3, appellation
        FROM (VALUES ${appellations
          .map(
            ({ romeCode, appellationCode }) =>
              `('${romeCode}', '${appellationCode}')`,
          )
          .join(", ")}) as t(rome_v3, appellation)
      )
      UPDATE public_appellations_data
      SET legacy_code_rome_v3 = appellation_rome_mapping.rome_v3
      FROM appellation_rome_mapping
      WHERE public_appellations_data.ogr_appellation = appellation_rome_mapping.appellation::int
    `,
    );

handleCRONScript(
  "update-rome-legacy-rome-v3-data-from-france-travail-API",
  config,
  main,
  ({ numberOfAppellations }) =>
    [
      "Updated successfully rome and appellations data from ROME-3 API",
      `Number of appellations: ${numberOfAppellations}`,
    ].join("\n"),
  logger,
);
