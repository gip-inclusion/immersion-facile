import { PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { InMemoryOutboxQueries } from "../../secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../secondary/core/InMemoryOutboxRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryLaBonneBoiteRequestRepository } from "../../secondary/immersionOffer/InMemoryLaBonneBoiteRequestRepository";
import { InMemorySearchMadeRepository } from "../../secondary/immersionOffer/InMemorySearchMadeRepository";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionQueries } from "../../secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../secondary/InMemoryConventionRepository";
import { InMemoryExportQueries } from "../../secondary/InMemoryExportQueries";
import { InMemoryFeatureFlagRepository } from "../../secondary/InMemoryFeatureFlagRepository";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionAssessmentRepository } from "../../secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../secondary/InMemoryUowPerformer";
import { makeStubGetApiConsumerById } from "../../secondary/makeStubGetApiConsumerById";
import { makePgGetApiConsumerById } from "../../secondary/pg/makePgGetApiConsumerById";
import { PgAgencyRepository } from "../../secondary/pg/PgAgencyRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../secondary/pg/PgConventionPoleEmploiAdvisorRepository";
import { PgConventionQueries } from "../../secondary/pg/PgConventionQueries";
import { PgConventionRepository } from "../../secondary/pg/PgConventionRepository";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { PgExportQueries } from "../../secondary/pg/PgExportQueries";
import { PgFeatureFlagRepository } from "../../secondary/pg/PgFeatureFlagRepository";
import { PgFormEstablishmentRepository } from "../../secondary/pg/PgFormEstablishmentRepository";
import { PgImmersionAssessmentRepository } from "../../secondary/pg/PgImmersionAssessmentRepository";
import { PgLaBonneBoiteRequestRepository } from "../../secondary/pg/PgLaBonneBoiteRequestRepository";
import { PgOutboxQueries } from "../../secondary/pg/PgOutboxQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { PgPostalCodeDepartmentRegionQueries } from "../../secondary/pg/PgPostalCodeDepartmentRegionQueries";
import { PgRomeRepository } from "../../secondary/pg/PgRomeRepository";
import { PgSearchMadeRepository } from "../../secondary/pg/PgSearchMadeRepository";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { stubPostalCodeDepartmentRegionQueries } from "../../secondary/StubPostalCodeDepartmentRegionQueries";
import { AppConfig } from "./appConfig";
import { GetPgPoolFn } from "./createGateways";

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;
export const createInMemoryUow = () => {
  const outboxRepository = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
  const conventionRepository = new InMemoryConventionRepository();

  return {
    conventionPoleEmploiAdvisorRepository:
      new InMemoryConventionPoleEmploiAdvisorRepository(),
    immersionAssessmentRepository: new InMemoryImmersionAssessmentRepository(),
    romeRepository: new InMemoryRomeRepository(),
    outboxRepository,
    outboxQueries,
    formEstablishmentRepository: new InMemoryFormEstablishmentRepository(),
    establishmentAggregateRepository:
      new InMemoryEstablishmentAggregateRepository(),
    conventionRepository,
    conventionQueries: new InMemoryConventionQueries(
      conventionRepository,
      outboxRepository,
    ),
    postalCodeDepartmentRegionQueries: stubPostalCodeDepartmentRegionQueries,
    featureFlagRepository: new InMemoryFeatureFlagRepository(),
    agencyRepository: new InMemoryAgencyRepository(),
    laBonneBoiteRequestRepository: new InMemoryLaBonneBoiteRequestRepository(),
    searchMadeRepository: new InMemorySearchMadeRepository(),
    getApiConsumersById: makeStubGetApiConsumerById({ clock: new RealClock() }),
    exportQueries: new InMemoryExportQueries(),
  };
};

// for typechecking only
const _isAssignable = (inMemoryUow: InMemoryUnitOfWork): UnitOfWork =>
  inMemoryUow;

export const createPgUow = (client: PoolClient): UnitOfWork => ({
  conventionPoleEmploiAdvisorRepository:
    new PgConventionPoleEmploiAdvisorRepository(client),
  immersionAssessmentRepository: new PgImmersionAssessmentRepository(client),
  romeRepository: new PgRomeRepository(client),
  outboxRepository: new PgOutboxRepository(client),
  outboxQueries: new PgOutboxQueries(client),
  agencyRepository: new PgAgencyRepository(client),
  formEstablishmentRepository: new PgFormEstablishmentRepository(client),
  establishmentAggregateRepository: new PgEstablishmentAggregateRepository(
    client,
  ),
  conventionRepository: new PgConventionRepository(client),
  conventionQueries: new PgConventionQueries(client),
  postalCodeDepartmentRegionQueries: new PgPostalCodeDepartmentRegionQueries(
    client,
  ),
  featureFlagRepository: new PgFeatureFlagRepository(client),
  laBonneBoiteRequestRepository: new PgLaBonneBoiteRequestRepository(client),
  searchMadeRepository: new PgSearchMadeRepository(client),
  getApiConsumersById: makePgGetApiConsumerById(client),
  exportQueries: new PgExportQueries(client),
});

export const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
): { uowPerformer: UnitOfWorkPerformer; inMemoryUow?: InMemoryUnitOfWork } =>
  config.repositories === "PG"
    ? { uowPerformer: new PgUowPerformer(getPgPoolFn(), createPgUow) }
    : makeInMemoryUowPerformer();

const makeInMemoryUowPerformer = () => {
  const inMemoryUow = createInMemoryUow();
  return {
    inMemoryUow,
    uowPerformer: new InMemoryUowPerformer(inMemoryUow),
  };
};
