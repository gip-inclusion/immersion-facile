import { Pool } from "pg";
import { random, sleep } from "shared/src/utils";
import { createLogger } from "../../utils/logger";
import { RealClock } from "../secondary/core/ClockImplementations";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
  ExponentialBackoffRetryStrategy,
} from "../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../secondary/core/QpsRateLimiter";
import { HttpsSireneGateway } from "../secondary/HttpsSireneGateway";
import { AppConfig } from "./appConfig";

const maxQpsSireneApi = 0.25;

const logger = createLogger(__filename);

const clock = new RealClock();

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

  const sireneGateway = new HttpsSireneGateway(
    config.sireneHttpsConfig,
    clock,
    new QpsRateLimiter(maxQpsSireneApi, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
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
    const siretIsCorrect = !!(await sireneGateway.get(payload.siret));
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

freeQuarantinedFormEstablishmentsWithCorrectSiret();
