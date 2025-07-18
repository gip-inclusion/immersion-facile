import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GetPgPoolFn } from "../../../../config/bootstrap/createGateways";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
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
  getPgPoolFn: GetPgPoolFn,
): { uowPerformer: UnitOfWorkPerformer; inMemoryUow?: InMemoryUnitOfWork } =>
  config.repositories === "PG"
    ? {
        uowPerformer: new PgUowPerformer(
          makeKyselyDb(getPgPoolFn()),
          createPgUow,
        ),
      }
    : makeInMemoryUowPerformer(createInMemoryUow());

const makeInMemoryUowPerformer = (inMemoryUow: InMemoryUnitOfWork) => ({
  inMemoryUow,
  uowPerformer: new InMemoryUowPerformer(inMemoryUow),
});
