import { Pool } from "pg";
import { MarkEstablishmentsAsSearchableScript } from "../../../domain/immersionOffer/useCases/MarkEstablishmentsAsSearchableScript";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { AppConfig } from "../config/appConfig";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const config = AppConfig.createFromEnv();
const dbUrl = config.pgImmersionDbUrl;

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

  const numberOfEstablishmentsUpdated = await markAsSearchableScript.execute();
  return { numberOfEstablishmentsUpdated };
};

/* eslint-disable-next-line @typescript-eslint/no-floating-promises */
handleEndOfScriptNotification(
  "markEstablishmentsAsSearchableWhenMaxContactsAllows",
  startScript,
  ({ numberOfEstablishmentsUpdated }) =>
    `${numberOfEstablishmentsUpdated} establishments have been marked as searchable again`,
);
