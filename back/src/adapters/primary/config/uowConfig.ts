import { PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { EstablishmentExportQueries } from "../../../domain/establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../../../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { ImmersionApplicationExportQueries } from "../../../domain/immersionApplication/ports/ImmersionApplicationExportQueries";
import { InMemoryOutboxQueries } from "../../secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../secondary/core/InMemoryOutboxRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionApplicationRepository } from "../../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../secondary/InMemoryUowPerformer";
import { makeStubGetFeatureFlags } from "../../secondary/makeStubGetFeatureFlags";
import { makePgGetFeatureFlags } from "../../secondary/pg/makePgGetFeatureFlags";
import { PgAgencyRepository } from "../../secondary/pg/PgAgencyRepository";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { PgEstablishmentExportQueries } from "../../secondary/pg/PgEstablishmentExportQueries";
import { PgFormEstablishmentRepository } from "../../secondary/pg/PgFormEstablishmentRepository";
import { PgImmersionApplicationExportQueries } from "../../secondary/pg/PgImmersionApplicationExportQueries";
import { PgImmersionApplicationRepository } from "../../secondary/pg/PgImmersionApplicationRepository";
import { PgOutboxQueries } from "../../secondary/pg/PgOutboxQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { PgPostalCodeDepartmentRegionQueries } from "../../secondary/pg/PgPostalCodeDepartmentRegionQueries";
import { PgRomeRepository } from "../../secondary/pg/PgRomeRepository";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { StubEstablishmentExportQueries } from "../../secondary/StubEstablishmentExportQueries";
import { StubImmersionApplicationExportQueries } from "../../secondary/StubImmersionApplicationExportQueries";
import { StubPostalCodeDepartmentRegionQueries } from "../../secondary/StubPostalCodeDepartmentRegionQueries";
import { AppConfig } from "./appConfig";
import { GetPgPoolFn, Repositories } from "./repositoriesConfig";

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;
export const createInMemoryUow = (repositories?: Repositories) => {
  const outboxRepo =
    (repositories?.outbox as InMemoryOutboxRepository) ??
    new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepo);
  return {
    romeRepo: repositories?.rome ?? new InMemoryRomeRepository(),
    outboxRepo,
    outboxQueries,
    formEstablishmentRepo:
      (repositories?.formEstablishment as InMemoryFormEstablishmentRepository) ??
      new InMemoryFormEstablishmentRepository(),
    establishmentAggregateRepo:
      (repositories?.immersionOffer as InMemoryEstablishmentAggregateRepository) ??
      new InMemoryEstablishmentAggregateRepository(),
    immersionApplicationRepo:
      (repositories?.immersionApplication as InMemoryImmersionApplicationRepository) ??
      new InMemoryImmersionApplicationRepository(),
    establishmentExportQueries:
      (repositories?.establishmentExport as EstablishmentExportQueries) ??
      StubEstablishmentExportQueries,
    immersionApplicationExportQueries:
      (repositories?.immersionApplicationExport as ImmersionApplicationExportQueries) ??
      StubImmersionApplicationExportQueries,
    postalCodeDepartmentRegionQueries:
      (repositories?.postalCodeDepartmentRegion as PostalCodeDepartmentRegionQueries) ??
      StubPostalCodeDepartmentRegionQueries,
    getFeatureFlags: makeStubGetFeatureFlags(),
    agencyRepo:
      (repositories?.agency as InMemoryAgencyRepository) ??
      new InMemoryAgencyRepository(),
  };
};

// for typechecking only
const _isAssignable = (inMemory: InMemoryUnitOfWork): UnitOfWork => inMemory;

export const createPgUow = (client: PoolClient): UnitOfWork => ({
  romeRepo: new PgRomeRepository(client),
  outboxRepo: new PgOutboxRepository(client),
  outboxQueries: new PgOutboxQueries(client),
  agencyRepo: new PgAgencyRepository(client),
  formEstablishmentRepo: new PgFormEstablishmentRepository(client),
  establishmentAggregateRepo: new PgEstablishmentAggregateRepository(client),
  immersionApplicationRepo: new PgImmersionApplicationRepository(client),
  establishmentExportQueries: new PgEstablishmentExportQueries(client),
  immersionApplicationExportQueries: new PgImmersionApplicationExportQueries(
    client,
  ),
  postalCodeDepartmentRegionQueries: new PgPostalCodeDepartmentRegionQueries(
    client,
  ),
  getFeatureFlags: makePgGetFeatureFlags(client),
});

export const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
  repositories: Repositories,
): UnitOfWorkPerformer =>
  config.repositories === "PG"
    ? new PgUowPerformer(getPgPoolFn(), createPgUow)
    : new InMemoryUowPerformer(createInMemoryUow(repositories));
