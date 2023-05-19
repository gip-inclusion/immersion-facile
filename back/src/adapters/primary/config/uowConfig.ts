import { PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { InMemoryErrorRepository } from "../../secondary/core/InMemoryErrorRepository";
import { InMemoryOutboxQueries } from "../../secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../secondary/core/InMemoryOutboxRepository";
import { PgErrorRepository } from "../../secondary/core/PgErrorRepository";
import { InMemoryDiscussionAggregateRepository } from "../../secondary/immersionOffer/InMemoryDiscussionAggregateRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryEstablishmentGroupRepository } from "../../secondary/immersionOffer/inMemoryEstablishmentGroupRepository";
import { InMemorySearchMadeRepository } from "../../secondary/immersionOffer/InMemorySearchMadeRepository";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryApiConsumerRepository } from "../../secondary/InMemoryApiConsumerRepository";
import { InMemoryAuthenticatedUserRepository } from "../../secondary/InMemoryAuthenticatedUserRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionQueries } from "../../secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../secondary/InMemoryConventionRepository";
import { InMemoryExportQueries } from "../../secondary/InMemoryExportQueries";
import { InMemoryFeatureFlagRepository } from "../../secondary/InMemoryFeatureFlagRepository";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionAssessmentRepository } from "../../secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryOngoingOAuthRepository } from "../../secondary/InMemoryOngoingOAuthRepository";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemoryShortLinkRepository } from "../../secondary/InMemoryShortLinkRepository";
import { InMemoryUowPerformer } from "../../secondary/InMemoryUowPerformer";
import { PgAgencyRepository } from "../../secondary/pg/PgAgencyRepository";
import { PgApiConsumerRepository } from "../../secondary/pg/PgApiConsumerRepository";
import { PgAuthenticatedUserRepository } from "../../secondary/pg/PgAuthenticatedUserRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../secondary/pg/PgConventionPoleEmploiAdvisorRepository";
import { PgConventionQueries } from "../../secondary/pg/PgConventionQueries";
import { PgConventionRepository } from "../../secondary/pg/PgConventionRepository";
import { PgDiscussionAggregateRepository } from "../../secondary/pg/PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { PgEstablishmentGroupRepository } from "../../secondary/pg/PgEstablishmentGroupRepository";
import { PgExportQueries } from "../../secondary/pg/PgExportQueries";
import { PgFeatureFlagRepository } from "../../secondary/pg/PgFeatureFlagRepository";
import { PgFormEstablishmentRepository } from "../../secondary/pg/PgFormEstablishmentRepository";
import { PgImmersionAssessmentRepository } from "../../secondary/pg/PgImmersionAssessmentRepository";
import { PgInclusionConnectedUserRepository } from "../../secondary/pg/PgInclusionConnectedUserRepository";
import { PgOngoingOAuthRepository } from "../../secondary/pg/PgOngoingOAuthRepository";
import { PgOutboxQueries } from "../../secondary/pg/PgOutboxQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { PgPostalCodeDepartmentRegionQueries } from "../../secondary/pg/PgPostalCodeDepartmentRegionQueries";
import { PgRomeRepository } from "../../secondary/pg/PgRomeRepository";
import { PgSearchMadeRepository } from "../../secondary/pg/PgSearchMadeRepository";
import { PgShortLinkRepository } from "../../secondary/pg/PgShortLinkRepository";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { stubPostalCodeDepartmentRegionQueries } from "../../secondary/StubPostalCodeDepartmentRegionQueries";
import { AppConfig } from "./appConfig";
import { GetPgPoolFn } from "./createGateways";

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;

export const createInMemoryUow = () => {
  const outboxRepository = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
  const conventionRepository = new InMemoryConventionRepository();
  const authenticatedUserRepository = new InMemoryAuthenticatedUserRepository();
  const shortLinkRepository = new InMemoryShortLinkRepository();

  return {
    agencyRepository: new InMemoryAgencyRepository(),
    apiConsumerRepository: new InMemoryApiConsumerRepository(),
    authenticatedUserRepository,
    conventionQueries: new InMemoryConventionQueries(
      conventionRepository,
      outboxRepository,
    ),
    conventionRepository,
    conventionPoleEmploiAdvisorRepository:
      new InMemoryConventionPoleEmploiAdvisorRepository(),
    discussionAggregateRepository: new InMemoryDiscussionAggregateRepository(),
    establishmentAggregateRepository:
      new InMemoryEstablishmentAggregateRepository(),
    establishmentGroupRepository: new InMemoryEstablishmentGroupRepository(),
    errorRepository: new InMemoryErrorRepository(),
    exportQueries: new InMemoryExportQueries(),
    featureFlagRepository: new InMemoryFeatureFlagRepository(),
    formEstablishmentRepository: new InMemoryFormEstablishmentRepository(),
    immersionAssessmentRepository: new InMemoryImmersionAssessmentRepository(),
    inclusionConnectedUserRepository:
      new InMemoryInclusionConnectedUserRepository(authenticatedUserRepository),
    ongoingOAuthRepository: new InMemoryOngoingOAuthRepository(),
    outboxRepository,
    outboxQueries,
    postalCodeDepartmentRegionQueries: stubPostalCodeDepartmentRegionQueries,
    romeRepository: new InMemoryRomeRepository(),
    searchMadeRepository: new InMemorySearchMadeRepository(),
    shortLinkQuery: shortLinkRepository,
    shortLinkRepository,
  } satisfies UnitOfWork;
};

export const createPgUow = (client: PoolClient): UnitOfWork => {
  const shortLinkRepository = new PgShortLinkRepository(client);
  return {
    agencyRepository: new PgAgencyRepository(client),
    apiConsumerRepository: new PgApiConsumerRepository(client),
    authenticatedUserRepository: new PgAuthenticatedUserRepository(client),
    conventionRepository: new PgConventionRepository(client),
    conventionQueries: new PgConventionQueries(client),
    conventionPoleEmploiAdvisorRepository:
      new PgConventionPoleEmploiAdvisorRepository(client),
    discussionAggregateRepository: new PgDiscussionAggregateRepository(client),
    establishmentAggregateRepository: new PgEstablishmentAggregateRepository(
      client,
    ),
    establishmentGroupRepository: new PgEstablishmentGroupRepository(client),
    errorRepository: new PgErrorRepository(),
    exportQueries: new PgExportQueries(client),
    featureFlagRepository: new PgFeatureFlagRepository(client),
    formEstablishmentRepository: new PgFormEstablishmentRepository(client),
    immersionAssessmentRepository: new PgImmersionAssessmentRepository(client),
    inclusionConnectedUserRepository: new PgInclusionConnectedUserRepository(
      client,
    ),
    ongoingOAuthRepository: new PgOngoingOAuthRepository(client),
    outboxRepository: new PgOutboxRepository(client),
    outboxQueries: new PgOutboxQueries(client),
    postalCodeDepartmentRegionQueries: new PgPostalCodeDepartmentRegionQueries(
      client,
    ),
    romeRepository: new PgRomeRepository(client),
    searchMadeRepository: new PgSearchMadeRepository(client),
    shortLinkRepository,
    shortLinkQuery: shortLinkRepository,
  };
};

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
