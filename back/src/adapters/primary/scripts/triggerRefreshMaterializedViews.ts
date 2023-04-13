import { Pool } from "pg";
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const logger = createLogger(__filename);

const config = AppConfig.createFromEnv();
const triggerRefreshMaterializedViews = async () => {
  logger.info("Starting to refresh materialized views");

  const dbUrl = config.pgImmersionDbUrl;

  const pool = new Pool({
    connectionString: dbUrl,
  });
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

/* eslint-disable @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "refresh materialized views",
  config,
  triggerRefreshMaterializedViews,
  () => "Materialized views refreshed successfully",
);
