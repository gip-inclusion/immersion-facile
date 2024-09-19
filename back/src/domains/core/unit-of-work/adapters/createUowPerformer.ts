import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { GetPgPoolFn } from "../../../../config/bootstrap/createGateways";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { createGetAppellationsByCode } from "../../../establishment/adapters/PgEstablishmentAggregateRepository";
import { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";
import { InMemoryUowPerformer } from "./InMemoryUowPerformer";
import { PgUowPerformer } from "./PgUowPerformer";
import { InMemoryUnitOfWork, createInMemoryUow } from "./createInMemoryUow";
import { createPgUow } from "./createPgUow";

export const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
): { uowPerformer: UnitOfWorkPerformer; inMemoryUow?: InMemoryUnitOfWork } => {
  if (config.repositories === "PG") {
    const db = makeKyselyDb(getPgPoolFn());
    return {
      uowPerformer: new PgUowPerformer(db, (db) =>
        createPgUow(db, createGetAppellationsByCode(db)),
      ),
    };
  }

  return makeInMemoryUowPerformer(createInMemoryUow());
};

const makeInMemoryUowPerformer = (inMemoryUow: InMemoryUnitOfWork) => ({
  inMemoryUow,
  uowPerformer: new InMemoryUowPerformer(inMemoryUow),
});
