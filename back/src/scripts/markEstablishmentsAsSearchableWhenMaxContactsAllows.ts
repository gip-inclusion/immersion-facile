import { Pool } from "pg";
import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../domains/establishment/adapters/PgEstablishmentAggregateRepository";
import { MarkEstablishmentsAsSearchableScript } from "../domains/establishment/use-cases/MarkEstablishmentsAsSearchableScript";
import { handleEndOfScriptNotification } from "./handleEndOfScriptNotification";

const config = AppConfig.createFromEnv();
const dbUrl = config.pgImmersionDbUrl;

const startScript = async () => {
  const timeGateway = new RealTimeGateway();
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const establishmentAggregateRepository =
    new PgEstablishmentAggregateRepository(makeKyselyDb(pool));

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
  config,
  startScript,
  ({ numberOfEstablishmentsUpdated }) =>
    `${numberOfEstablishmentsUpdated} establishments have been marked as searchable again`,
);
