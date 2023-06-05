import { Pool } from "pg";
import { random, sleep } from "shared";
import { createLogger } from "../../../utils/logger";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { InseeSiretGateway } from "../../secondary/siret/InseeSiretGateway";
import { AppConfig } from "../config/appConfig";

const logger = createLogger(__filename);

const timeGateway = new RealTimeGateway();

const config = AppConfig.createFromEnv();

const freeQuarantinedFormEstablishmentsWithCorrectSiret = async () => {
  logger.info(
    "Starting to free quarantined form establishments with correct siret",
  );

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();

  const siretGateway = new InseeSiretGateway(
    config.inseeHttpConfig,
    timeGateway,
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      timeGateway,
      sleep,
      random,
    ),
  );

  const quarantinedFormEstablishmentAddedResult = await client.query(
    "SELECT id, payload FROM outbox WHERE topic='FormEstablishmentAdded' AND was_quarantined LIMIT 300",
  );
  logger.info(
    `Found ${quarantinedFormEstablishmentAddedResult.rowCount} events with topic 'FormEstablishmentAdded' in quarantined.`,
  );
  for (const { payload, id } of quarantinedFormEstablishmentAddedResult.rows) {
    const siretIsCorrect = !!(await siretGateway.getEstablishmentBySiret(
      payload.siret,
    ));
    if (siretIsCorrect) {
      await client.query(
        "UPDATE outbox SET was_quarantined=false WHERE id=$1; ",
        [id],
      );
      logger.info(`[OK] Event with id ${id} left quarantine !`);
    } else
      logger.info(
        `[NOK] Event with id ${id} stays in quarantine, since siret ${payload.siret} seems incorrect.`,
      );
  }
  client.release();
  await pool.end();
};

freeQuarantinedFormEstablishmentsWithCorrectSiret().then(
  () => {
    logger.info(`Script finished success`);
    process.exit(0);
  },
  (error: any) => {
    logger.error(error, `Script failed`);
    process.exit(1);
  },
);
