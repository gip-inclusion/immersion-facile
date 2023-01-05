import { Pool } from "pg";
import { createLogger } from "../../../utils/logger";
import { AppConfig } from "../config/appConfig";

const logger = createLogger(__filename);

const triggerRefreshMaterializedViews = async () => {
  logger.info("Starting to refresh materialized views");
  const config = AppConfig.createFromEnv();

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

/* eslint-disable no-console */
triggerRefreshMaterializedViews()
  .then(() => {
    logger.info("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Script failed with error : ", error);
    process.exit(1);
  });
