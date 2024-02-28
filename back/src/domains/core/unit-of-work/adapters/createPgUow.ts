import { KyselyDb } from "../../../../adapters/secondary/pg/kysely/kyselyUtils";
import { PgAgencyGroupRepository } from "../../../../adapters/secondary/pg/repositories/PgAgencyGroupRepository";
import { PgAgencyRepository } from "../../../../adapters/secondary/pg/repositories/PgAgencyRepository";
import { PgAssessmentRepository } from "../../../../adapters/secondary/pg/repositories/PgAssessmentRepository";
import { PgAuthenticatedUserRepository } from "../../../../adapters/secondary/pg/repositories/PgAuthenticatedUserRepository";
import { PgConventionExternalIdRepository } from "../../../../adapters/secondary/pg/repositories/PgConventionExternalIdRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../../../adapters/secondary/pg/repositories/PgConventionPoleEmploiAdvisorRepository";
import { PgConventionQueries } from "../../../../adapters/secondary/pg/repositories/PgConventionQueries";
import { PgConventionRepository } from "../../../../adapters/secondary/pg/repositories/PgConventionRepository";
import { PgConventionsToSyncRepository } from "../../../../adapters/secondary/pg/repositories/PgConventionsToSyncRepository";
import { PgDeletedEstablishmentRepository } from "../../../../adapters/secondary/pg/repositories/PgDeletedEstablishmentRepository";
import { PgDiscussionAggregateRepository } from "../../../../adapters/secondary/pg/repositories/PgDiscussionAggregateRepository";
import { PgErrorRepository } from "../../../../adapters/secondary/pg/repositories/PgErrorRepository";
import { PgEstablishmentAggregateRepository } from "../../../../adapters/secondary/pg/repositories/PgEstablishmentAggregateRepository";
import { PgEstablishmentLeadQueries } from "../../../../adapters/secondary/pg/repositories/PgEstablishmentLeadQueries";
import { PgEstablishmentLeadRepository } from "../../../../adapters/secondary/pg/repositories/PgEstablishmentLeadRepository";
import { PgFormEstablishmentRepository } from "../../../../adapters/secondary/pg/repositories/PgFormEstablishmentRepository";
import { PgGroupRepository } from "../../../../adapters/secondary/pg/repositories/PgGroupRepository";
import { PgInclusionConnectedUserRepository } from "../../../../adapters/secondary/pg/repositories/PgInclusionConnectedUserRepository";
import { PgNotificationRepository } from "../../../../adapters/secondary/pg/repositories/PgNotificationRepository";
import { PgOngoingOAuthRepository } from "../../../../adapters/secondary/pg/repositories/PgOngoingOAuthRepository";
import { PgRomeRepository } from "../../../../adapters/secondary/pg/repositories/PgRomeRepository";
import { PgSearchMadeRepository } from "../../../../adapters/secondary/pg/repositories/PgSearchMadeRepository";
import { PgApiConsumerRepository } from "../../api-consumer/adapters/PgApiConsumerRepository";
import { PgOutboxQueries } from "../../events/adapters/PgOutboxQueries";
import { PgOutboxRepository } from "../../events/adapters/PgOutboxRepository";
import { PgFeatureFlagRepository } from "../../feature-flags/adapters/PgFeatureFlagRepository";
import { PgShortLinkRepository } from "../../short-link/adapters/short-link-repository/PgShortLinkRepository";
import { UnitOfWork } from "../ports/UnitOfWork";

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
