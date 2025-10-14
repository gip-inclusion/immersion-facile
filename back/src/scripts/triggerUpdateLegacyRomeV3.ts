import { sql } from "kysely";
import { map, splitEvery } from "ramda";
import { type AppellationCode, pipeWithValue, type RomeCode } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../config/bootstrap/appConfig";
import {
  type KyselyDb,
  makeKyselyDb,
  values,
} from "../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import {
  HttpRome3Gateway,
  makeRome3Routes,
} from "../domains/agency/adapters/ft-agencies-referential/HttpRome3Gateway";
import { createFranceTravailRoutes } from "../domains/convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../domains/convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { withNoCache } from "../domains/core/caching-gateway/adapters/withNoCache";
import { noRetries } from "../domains/core/retry-strategy/ports/RetryStrategy";
import { makeAxiosInstances } from "../utils/axiosUtils";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const main = async () => {
  const pool = createMakeScriptPgPool(config)();
  const db = makeKyselyDb(pool, { skipErrorLog: true });

  const franceTravailRoutes = createFranceTravailRoutes({
    ftApiUrl: config.ftApiUrl,
    ftEnterpriseUrl: config.ftEnterpriseUrl,
  });

  const franceTravailGateway = new HttpFranceTravailGateway(
    createAxiosSharedClient(
      franceTravailRoutes,
      makeAxiosInstances(config.externalAxiosTimeout).axiosWithValidateStatus,
    ),
    withNoCache,
    config.ftApiUrl,
    config.franceTravailAccessTokenConfig,
    noRetries,
    franceTravailRoutes,
  );

  const httpRome3Gateway = new HttpRome3Gateway(
    createAxiosSharedClient(
      makeRome3Routes(config.ftApiUrl),
      makeAxiosInstances(config.externalAxiosTimeout)
        .axiosWithoutValidateStatus,
    ),
    franceTravailGateway,
    config.franceTravailClientId,
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

handleCRONScript({
  name: "update-rome-legacy-rome-v3-data-from-france-travail-API",
  config,
  script: main,
  handleResults: ({ numberOfAppellations }) =>
    [
      "Updated successfully rome and appellations data from ROME-3 API",
      `Number of appellations: ${numberOfAppellations}`,
    ].join("\n"),
  logger,
});
