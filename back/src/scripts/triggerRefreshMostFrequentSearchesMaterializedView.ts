import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import { updateStatsMostFrequentSearchesSql } from "../domains/establishment/adapters/updateStatsMostFrequentSearchesSql";
import { handleCRONScript } from "./handleCRONScript";
import { monitoredAsUseCase } from "./utils";

const config = AppConfig.createFromEnv();

const refreshStatsTable = async () => {
  const pool = createMakeScriptPgPool(config)();
  const db = makeKyselyDb(pool);

  await updateStatsMostFrequentSearchesSql(db);

  await pool.end();
};

handleCRONScript({
  name: "stats__most_frequent_searches table",
  config,
  script: monitoredAsUseCase({
    name: "RefreshStatsMostFrequentSearches",
    cb: refreshStatsTable,
  }),
  handleResults: () =>
    "stats__most_frequent_searches table refreshed successfully",
});
