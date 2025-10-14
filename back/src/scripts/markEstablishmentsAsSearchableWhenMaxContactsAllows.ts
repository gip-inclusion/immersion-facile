import { AppConfig } from "../config/bootstrap/appConfig";
import { makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import { RealTimeGateway } from "../domains/core/time-gateway/adapters/RealTimeGateway";
import { PgEstablishmentAggregateRepository } from "../domains/establishment/adapters/PgEstablishmentAggregateRepository";
import { MarkEstablishmentsAsSearchableScript } from "../domains/establishment/use-cases/MarkEstablishmentsAsSearchableScript";
import { handleCRONScript } from "./handleCRONScript";

const config = AppConfig.createFromEnv();

const startScript = async () => {
  const timeGateway = new RealTimeGateway();
  const pool = createMakeScriptPgPool(config)();

  const establishmentAggregateRepository =
    new PgEstablishmentAggregateRepository(makeKyselyDb(pool));

  const markAsSearchableScript = new MarkEstablishmentsAsSearchableScript(
    establishmentAggregateRepository,
    timeGateway,
  );

  const numberOfEstablishmentsUpdated = await markAsSearchableScript.execute();
  return { numberOfEstablishmentsUpdated };
};

handleCRONScript({
  name: "markEstablishmentsAsSearchableWhenMaxContactsAllows",
  config,
  script: startScript,
  handleResults: ({ numberOfEstablishmentsUpdated }) =>
    `${numberOfEstablishmentsUpdated} establishments have been marked as searchable again`,
});
