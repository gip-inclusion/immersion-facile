import { Pool } from "pg";
import { MarkEstablishmentsAsSearchableScript } from "../../../domain/immersionOffer/useCases/MarkEstablishmentsAsSearchableScript";
import { createLogger } from "../../../utils/logger";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { AppConfig } from "../config/appConfig";

const config = AppConfig.createFromEnv();
const dbUrl = config.pgImmersionDbUrl;
const logger = createLogger(__filename);

const startScript = async () => {
  const timeGateway = new RealTimeGateway();
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();

  const establishmentAggregateRepository =
    new PgEstablishmentAggregateRepository(client);

  const markAsSearchableScript = new MarkEstablishmentsAsSearchableScript(
    establishmentAggregateRepository,
    timeGateway,
  );

  return markAsSearchableScript.execute();
};

startScript()
  .then((numberOfEstablishmentsUpdated) => {
    logger.info(
      { numberOfEstablishmentsUpdated },
      "Establishment which needed to be searchable again have been processed",
    );
  })
  .catch((error) => {
    logger.error(
      { error },
      "Error while processing establishment which needed to be searchable again",
    );
  });
