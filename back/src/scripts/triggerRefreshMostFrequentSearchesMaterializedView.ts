import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import { handleCRONScript } from "./handleCRONScript";
import { monitoredAsUseCase } from "./utils";

const config = AppConfig.createFromEnv();
const refreshMostFrequentSearchesMaterializedView = async () => {
  const pool = createMakeScriptPgPool(config)();
  const client = await pool.connect();

  await client.query("REFRESH MATERIALIZED VIEW most_frequent_searches;");

  client.release();
  await pool.end();
};

handleCRONScript({
  name: "most_frequent_searches materialized view",
  config,
  script: monitoredAsUseCase({
    name: "RefreshMostFrequentSearchesMaterializedView",
    cb: refreshMostFrequentSearchesMaterializedView,
  }),
  handleResults: () =>
    "searches_made_aggregated materialized view refreshed successfully",
});
