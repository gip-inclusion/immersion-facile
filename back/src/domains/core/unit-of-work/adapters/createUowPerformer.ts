import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { MakePgPool } from "../../../../config/pg/pgPool";
import type { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "./createInMemoryUow";
import { createPgUow } from "./createPgUow";
import { InMemoryUowPerformer } from "./InMemoryUowPerformer";
import { PgUowPerformer } from "./PgUowPerformer";

export const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: MakePgPool,
): { uowPerformer: UnitOfWorkPerformer; inMemoryUow?: InMemoryUnitOfWork } =>
  config.repositories === "PG"
    ? {
        uowPerformer: new PgUowPerformer(
          makeKyselyDb(getPgPoolFn(), { isDev: config.nodeEnv === "local" }),
          createPgUow,
        ),
      }
    : makeInMemoryUowPerformer(createInMemoryUow());

const makeInMemoryUowPerformer = (inMemoryUow: InMemoryUnitOfWork) => ({
  inMemoryUow,
  uowPerformer: new InMemoryUowPerformer(inMemoryUow),
});
