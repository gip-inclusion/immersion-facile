import axios from "axios";
import { sql } from "kysely";
import { Pool } from "pg";
import { map, splitEvery } from "ramda";
import { AppellationCode, RomeCode, pipeWithValue } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AccessTokenResponse, AppConfig } from "../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../config/helpers/createAxiosSharedClients";
import {
  KyselyDb,
  makeKyselyDb,
  values,
} from "../config/pg/kysely/kyselyUtils";
import {
  HttpRome3Gateway,
  makeRome3Routes,
} from "../domains/agency/adapters/pe-agencies-referential/HttpRome3Gateway";
import { HttpFranceTravailGateway } from "../domains/convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
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

  const franceTravailGateway = new HttpFranceTravailGateway(
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
    db
      .updateTable("public_appellations_data")
      .from(values(appellations, "rome_v3_mapping"))
      .set((eb) => ({
        legacy_code_rome_v3: eb.ref("rome_v3_mapping.romeCode"),
      }))
      .whereRef(
        sql`"ogr_appellation"::text`,
        "=",
        "rome_v3_mapping.appellationCode",
      )
      .execute();

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
