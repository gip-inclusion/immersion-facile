import { InMemoryApiConsumerRepository } from "../../../domain/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import { PgApiConsumerRepository } from "../../../domain/core/api-consumer/adapters/PgApiConsumerRepository";
import { InMemoryOutboxQueries } from "../../../domain/core/events/adapters/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../../domain/core/events/adapters/InMemoryOutboxRepository";
import { PgOutboxQueries } from "../../../domain/core/events/adapters/PgOutboxQueries";
import { PgOutboxRepository } from "../../../domain/core/events/adapters/PgOutboxRepository";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { InMemoryShortLinkRepository } from "../../../domain/core/short-link/adapters/short-link-repository/InMemoryShortLinkRepository";
import { PgShortLinkRepository } from "../../../domain/core/short-link/adapters/short-link-repository/PgShortLinkRepository";
import { InMemoryAgencyGroupRepository } from "../../secondary/InMemoryAgencyGroupRepository";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryAssessmentRepository } from "../../secondary/InMemoryAssessmentRepository";
import { InMemoryAuthenticatedUserRepository } from "../../secondary/InMemoryAuthenticatedUserRepository";
import { InMemoryConventionExternalIdRepository } from "../../secondary/InMemoryConventionExternalIdRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionQueries } from "../../secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../secondary/InMemoryConventionRepository";
import { InMemoryConventionsToSyncRepository } from "../../secondary/InMemoryConventionsToSyncRepository";
import { InMemoryDeletedEstablishmentRepository } from "../../secondary/InMemoryDeletedEstablishmentRepository";
import { InMemoryEstablishmentLeadQueries } from "../../secondary/InMemoryEstablishmentLeadQueries";
import { InMemoryFeatureFlagRepository } from "../../secondary/InMemoryFeatureFlagRepository";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryNotificationRepository } from "../../secondary/InMemoryNotificationRepository";
import { InMemoryOngoingOAuthRepository } from "../../secondary/InMemoryOngoingOAuthRepository";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../secondary/InMemoryUowPerformer";
import { InMemoryErrorRepository } from "../../secondary/core/InMemoryErrorRepository";
import { InMemoryDiscussionAggregateRepository } from "../../secondary/offer/InMemoryDiscussionAggregateRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemoryEstablishmentLeadRepository } from "../../secondary/offer/InMemoryEstablishmentLeadRepository";
import { InMemoryGroupRepository } from "../../secondary/offer/InMemoryGroupRepository";
import { InMemorySearchMadeRepository } from "../../secondary/offer/InMemorySearchMadeRepository";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { KyselyDb } from "../../secondary/pg/kysely/kyselyUtils";
import { PgAgencyGroupRepository } from "../../secondary/pg/repositories/PgAgencyGroupRepository";
import { PgAgencyRepository } from "../../secondary/pg/repositories/PgAgencyRepository";
import { PgAssessmentRepository } from "../../secondary/pg/repositories/PgAssessmentRepository";
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
import { PgEstablishmentLeadQueries } from "../../secondary/pg/repositories/PgEstablishmentLeadQueries";
import { PgEstablishmentLeadRepository } from "../../secondary/pg/repositories/PgEstablishmentLeadRepository";
import { PgFeatureFlagRepository } from "../../secondary/pg/repositories/PgFeatureFlagRepository";
import { PgFormEstablishmentRepository } from "../../secondary/pg/repositories/PgFormEstablishmentRepository";
import { PgGroupRepository } from "../../secondary/pg/repositories/PgGroupRepository";
import { PgInclusionConnectedUserRepository } from "../../secondary/pg/repositories/PgInclusionConnectedUserRepository";
import { PgNotificationRepository } from "../../secondary/pg/repositories/PgNotificationRepository";
import { PgOngoingOAuthRepository } from "../../secondary/pg/repositories/PgOngoingOAuthRepository";
import { PgRomeRepository } from "../../secondary/pg/repositories/PgRomeRepository";
import { PgSearchMadeRepository } from "../../secondary/pg/repositories/PgSearchMadeRepository";
import { AppConfig } from "./appConfig";
import { GetPgPoolFn } from "./createGateways";

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;

export const createInMemoryUow = () => {
  const outboxRepository = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
  const agencyRepository = new InMemoryAgencyRepository();
  const conventionRepository = new InMemoryConventionRepository();
  const conventionQueries = new InMemoryConventionQueries(
    conventionRepository,
    agencyRepository,
    outboxRepository,
  );
  const authenticatedUserRepository = new InMemoryAuthenticatedUserRepository();
  const shortLinkRepository = new InMemoryShortLinkRepository();
  const establishmentLeadRepository = new InMemoryEstablishmentLeadRepository();

  return {
    agencyRepository,
    agencyGroupRepository: new InMemoryAgencyGroupRepository(),
    apiConsumerRepository: new InMemoryApiConsumerRepository(),
    authenticatedUserRepository,
    conventionQueries,
    conventionRepository,
    conventionPoleEmploiAdvisorRepository:
      new InMemoryConventionPoleEmploiAdvisorRepository(),
    conventionsToSyncRepository: new InMemoryConventionsToSyncRepository(),
    discussionAggregateRepository: new InMemoryDiscussionAggregateRepository(),
    establishmentAggregateRepository:
      new InMemoryEstablishmentAggregateRepository(),
    groupRepository: new InMemoryGroupRepository(),
    errorRepository: new InMemoryErrorRepository(),
    featureFlagRepository: new InMemoryFeatureFlagRepository(),
    formEstablishmentRepository: new InMemoryFormEstablishmentRepository(),
    assessmentRepository: new InMemoryAssessmentRepository(),
    inclusionConnectedUserRepository:
      new InMemoryInclusionConnectedUserRepository(authenticatedUserRepository),
    establishmentLeadRepository,
    establishmentLeadQueries: new InMemoryEstablishmentLeadQueries(
      establishmentLeadRepository,
      conventionQueries,
    ),
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

export const createPgUow = (transaction: KyselyDb): UnitOfWork => {
  const shortLinkRepository = new PgShortLinkRepository(transaction);
  return {
    agencyRepository: new PgAgencyRepository(transaction),
    agencyGroupRepository: new PgAgencyGroupRepository(transaction),
    apiConsumerRepository: new PgApiConsumerRepository(transaction),
    authenticatedUserRepository: new PgAuthenticatedUserRepository(transaction),
    conventionPoleEmploiAdvisorRepository:
      new PgConventionPoleEmploiAdvisorRepository(transaction),
    conventionExternalIdRepository: new PgConventionExternalIdRepository(
      transaction,
    ),
    conventionQueries: new PgConventionQueries(transaction),
    conventionRepository: new PgConventionRepository(transaction),
    conventionsToSyncRepository: new PgConventionsToSyncRepository(transaction),
    deletedEstablishmentRepository: new PgDeletedEstablishmentRepository(
      transaction,
    ),
    discussionAggregateRepository: new PgDiscussionAggregateRepository(
      transaction,
    ),
    errorRepository: new PgErrorRepository(transaction),
    establishmentAggregateRepository: new PgEstablishmentAggregateRepository(
      transaction,
    ),
    establishmentLeadRepository: new PgEstablishmentLeadRepository(transaction),
    establishmentLeadQueries: new PgEstablishmentLeadQueries(transaction),
    groupRepository: new PgGroupRepository(transaction),
    featureFlagRepository: new PgFeatureFlagRepository(transaction),
    formEstablishmentRepository: new PgFormEstablishmentRepository(transaction),
    assessmentRepository: new PgAssessmentRepository(transaction),
    inclusionConnectedUserRepository: new PgInclusionConnectedUserRepository(
      transaction,
    ),
    notificationRepository: new PgNotificationRepository(transaction),
    ongoingOAuthRepository: new PgOngoingOAuthRepository(transaction),
    outboxQueries: new PgOutboxQueries(transaction),
    outboxRepository: new PgOutboxRepository(transaction),
    romeRepository: new PgRomeRepository(transaction),
    searchMadeRepository: new PgSearchMadeRepository(transaction),
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
