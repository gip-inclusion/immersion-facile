import { AppConfig } from "../config/bootstrap/appConfig";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const triggerRefreshMaterializedViews = async () => {
  logger.info({ message: "Starting to refresh materialized views" });

  const pool = createMakeScriptPgPool(config)();

  const client = await pool.connect();

  const materializedViews = [
    "view_siret_with_department_region",
    "view_contact_requests",
    "view_establishments",
    "view_establishments_with_flatten_offers",
    "view_establishments_with_aggregated_offers",
  ];
  for (const materializedView of materializedViews) {
    await client.query(`REFRESH MATERIALIZED VIEW ${materializedView};`);
  }
  client.release();
  await pool.end();
};

handleCRONScript(
  "refresh materialized views",
  config,
  triggerRefreshMaterializedViews,
  () => "Materialized views refreshed successfully",
);
