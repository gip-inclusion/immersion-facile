import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GetPgPoolFn } from "../../../../adapters/primary/config/createGateways";
import { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";
import { InMemoryUowPerformer } from "./InMemoryUowPerformer";
import { PgUowPerformer } from "./PgUowPerformer";
import { InMemoryUnitOfWork, createInMemoryUow } from "./createInMemoryUow";
import { createPgUow } from "./createPgUow";

export const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
): { uowPerformer: UnitOfWorkPerformer; inMemoryUow?: InMemoryUnitOfWork } =>
  config.repositories === "PG"
    ? { uowPerformer: new PgUowPerformer(getPgPoolFn(), createPgUow) }
    : makeInMemoryUowPerformer(createInMemoryUow());

const makeInMemoryUowPerformer = (inMemoryUow: InMemoryUnitOfWork) => ({
  inMemoryUow,
  uowPerformer: new InMemoryUowPerformer(inMemoryUow),
});
