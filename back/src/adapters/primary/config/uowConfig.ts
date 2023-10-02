import { PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { InMemoryErrorRepository } from "../../secondary/core/InMemoryErrorRepository";
import { InMemoryOutboxQueries } from "../../secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../secondary/core/InMemoryOutboxRepository";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryApiConsumerRepository } from "../../secondary/InMemoryApiConsumerRepository";
import { InMemoryAuthenticatedUserRepository } from "../../secondary/InMemoryAuthenticatedUserRepository";
import { InMemoryConventionExternalIdRepository } from "../../secondary/InMemoryConventionExternalIdRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionQueries } from "../../secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../secondary/InMemoryConventionRepository";
import { InMemoryConventionsToSyncRepository } from "../../secondary/InMemoryConventionsToSyncRepository";
import { InMemoryDeletedEstablishmentRepository } from "../../secondary/InMemoryDeletedEstablishmentRepository";
import { InMemoryFeatureFlagRepository } from "../../secondary/InMemoryFeatureFlagRepository";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionAssessmentRepository } from "../../secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryNotificationRepository } from "../../secondary/InMemoryNotificationRepository";
import { InMemoryOngoingOAuthRepository } from "../../secondary/InMemoryOngoingOAuthRepository";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemoryShortLinkRepository } from "../../secondary/InMemoryShortLinkRepository";
import { InMemoryUowPerformer } from "../../secondary/InMemoryUowPerformer";
import { InMemoryDiscussionAggregateRepository } from "../../secondary/offer/InMemoryDiscussionAggregateRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemoryEstablishmentGroupRepository } from "../../secondary/offer/InMemoryEstablishmentGroupRepository";
import { InMemorySearchMadeRepository } from "../../secondary/offer/InMemorySearchMadeRepository";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { PgAgencyRepository } from "../../secondary/pg/repositories/PgAgencyRepository";
import { PgApiConsumerRepository } from "../../secondary/pg/repositories/PgApiConsumerRepository";
import { PgAuthenticatedUserRepository } from "../../secondary/pg/repositories/PgAuthenticatedUserRepository";
import { PgConventionExternalIdRepository } from "../../secondary/pg/repositories/PgConventionExternalIdRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../secondary/pg/repositories/PgConventionPoleEmploiAdvisorRepository";
import { PgConventionQueries } from "../../secondary/pg/repositories/PgConventionQueries";
import { PgConventionRepository } from "../../secondary/pg/repositories/PgConventionRepository";
import { PgConventionsToSyncRepository } from "../../secondary/pg/repositories/PgConventionsToSyncRepository";
import { PgDeletedEstablishmentRepository } from "../../secondary/pg/repositories/PgDeletedEstablishmentRepository";
import { PgDiscussionAggregateRepository } from "../../secondary/pg/repositories/PgDiscussionAggregateRepository";
import { PgErrorRepository } from "../../secondary/pg/repositories/PgErrorRepository";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/repositories/PgEstablishmentAggregateRepository";
import { PgEstablishmentGroupRepository } from "../../secondary/pg/repositories/PgEstablishmentGroupRepository";
import { PgFeatureFlagRepository } from "../../secondary/pg/repositories/PgFeatureFlagRepository";
import { PgFormEstablishmentRepository } from "../../secondary/pg/repositories/PgFormEstablishmentRepository";
import { PgImmersionAssessmentRepository } from "../../secondary/pg/repositories/PgImmersionAssessmentRepository";
import { PgInclusionConnectedUserRepository } from "../../secondary/pg/repositories/PgInclusionConnectedUserRepository";
import { PgNotificationRepository } from "../../secondary/pg/repositories/PgNotificationRepository";
import { PgOngoingOAuthRepository } from "../../secondary/pg/repositories/PgOngoingOAuthRepository";
import { PgOutboxQueries } from "../../secondary/pg/repositories/PgOutboxQueries";
import { PgOutboxRepository } from "../../secondary/pg/repositories/PgOutboxRepository";
import { PgRomeRepository } from "../../secondary/pg/repositories/PgRomeRepository";
import { PgSearchMadeRepository } from "../../secondary/pg/repositories/PgSearchMadeRepository";
import { PgShortLinkRepository } from "../../secondary/pg/repositories/PgShortLinkRepository";
import { AppConfig } from "./appConfig";
import { GetPgPoolFn } from "./createGateways";

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;

export const createInMemoryUow = () => {
  const outboxRepository = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
  const conventionRepository = new InMemoryConventionRepository();
  const authenticatedUserRepository = new InMemoryAuthenticatedUserRepository();
  const shortLinkRepository = new InMemoryShortLinkRepository();
  const agencyRepository = new InMemoryAgencyRepository();

  return {
    agencyRepository,
    apiConsumerRepository: new InMemoryApiConsumerRepository(),
    authenticatedUserRepository,
    conventionQueries: new InMemoryConventionQueries(
      conventionRepository,
      agencyRepository,
      outboxRepository,
    ),
    conventionRepository,
    conventionPoleEmploiAdvisorRepository:
      new InMemoryConventionPoleEmploiAdvisorRepository(),
    conventionsToSyncRepository: new InMemoryConventionsToSyncRepository(),
    discussionAggregateRepository: new InMemoryDiscussionAggregateRepository(),
    establishmentAggregateRepository:
      new InMemoryEstablishmentAggregateRepository(),
    establishmentGroupRepository: new InMemoryEstablishmentGroupRepository(),
    errorRepository: new InMemoryErrorRepository(),
    featureFlagRepository: new InMemoryFeatureFlagRepository(),
    formEstablishmentRepository: new InMemoryFormEstablishmentRepository(),
    immersionAssessmentRepository: new InMemoryImmersionAssessmentRepository(),
    inclusionConnectedUserRepository:
      new InMemoryInclusionConnectedUserRepository(authenticatedUserRepository),
    notificationRepository: new InMemoryNotificationRepository(),
    ongoingOAuthRepository: new InMemoryOngoingOAuthRepository(),
    outboxRepository,
    outboxQueries,
    romeRepository: new InMemoryRomeRepository(),
    searchMadeRepository: new InMemorySearchMadeRepository(),
    shortLinkQuery: shortLinkRepository,
    shortLinkRepository,
    deletedEstablishmentRepository:
      new InMemoryDeletedEstablishmentRepository(),
    conventionExternalIdRepository:
      new InMemoryConventionExternalIdRepository(),
  } satisfies UnitOfWork;
};

export const createPgUow = (client: PoolClient): UnitOfWork => {
  const shortLinkRepository = new PgShortLinkRepository(client);
  return {
    agencyRepository: new PgAgencyRepository(client),
    apiConsumerRepository: new PgApiConsumerRepository(client),
    authenticatedUserRepository: new PgAuthenticatedUserRepository(client),
    conventionPoleEmploiAdvisorRepository:
      new PgConventionPoleEmploiAdvisorRepository(client),
    conventionExternalIdRepository: new PgConventionExternalIdRepository(
      client,
    ),
    conventionQueries: new PgConventionQueries(client),
    conventionRepository: new PgConventionRepository(client),
    conventionsToSyncRepository: new PgConventionsToSyncRepository(client),
    deletedEstablishmentRepository: new PgDeletedEstablishmentRepository(
      client,
    ),
    discussionAggregateRepository: new PgDiscussionAggregateRepository(client),
    errorRepository: new PgErrorRepository(client),
    establishmentAggregateRepository: new PgEstablishmentAggregateRepository(
      client,
    ),
    establishmentGroupRepository: new PgEstablishmentGroupRepository(client),
    featureFlagRepository: new PgFeatureFlagRepository(client),
    formEstablishmentRepository: new PgFormEstablishmentRepository(client),
    immersionAssessmentRepository: new PgImmersionAssessmentRepository(client),
    inclusionConnectedUserRepository: new PgInclusionConnectedUserRepository(
      client,
    ),
    notificationRepository: new PgNotificationRepository(client),
    ongoingOAuthRepository: new PgOngoingOAuthRepository(client),
    outboxQueries: new PgOutboxQueries(client),
    outboxRepository: new PgOutboxRepository(client),
    romeRepository: new PgRomeRepository(client),
    searchMadeRepository: new PgSearchMadeRepository(client),
    shortLinkQuery: shortLinkRepository,
    shortLinkRepository,
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
