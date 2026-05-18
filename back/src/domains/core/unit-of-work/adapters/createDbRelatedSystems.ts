import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { MakePgPool } from "../../../../config/pg/pgPool";
import { withNoCache } from "../../caching-gateway/adapters/withNoCache";
import type { WithCache } from "../../caching-gateway/port/WithCache";
import type { OutOfTransactionQueries } from "../ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";
import {
  createInMemoryOutOfTransactionQueries,
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "./createInMemoryUow";
import { createPgQueries, createPgUow } from "./createPgUow";
import { InMemoryUowPerformer } from "./InMemoryUowPerformer";
import { PgUowPerformer } from "./PgUowPerformer";

export const createDbRelatedSystems = (
  config: AppConfig,
  getPgPoolFn: MakePgPool,
  withCache: WithCache = withNoCache,
): {
  uowPerformer: UnitOfWorkPerformer;
  queries: OutOfTransactionQueries;
  inMemoryUow?: InMemoryUnitOfWork;
} => {
  if (config.repositories === "PG") {
    const db = makeKyselyDb(getPgPoolFn(), {
      isDev: config.nodeEnv === "local",
    });
    return {
      uowPerformer: new PgUowPerformer(db, createPgUow),
      queries: createPgQueries(db, withCache),
    };
  }

  return makeInMemoryDbRelatedSystems(createInMemoryUow());
};

const makeInMemoryDbRelatedSystems = (inMemoryUow: InMemoryUnitOfWork) => ({
  inMemoryUow,
  uowPerformer: new InMemoryUowPerformer(inMemoryUow),
  queries: createInMemoryOutOfTransactionQueries(inMemoryUow),
});
