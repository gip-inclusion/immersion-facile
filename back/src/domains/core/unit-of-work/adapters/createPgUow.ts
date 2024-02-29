import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { PgAgencyGroupRepository } from "../../../agency/adapters/PgAgencyGroupRepository";
import { PgAgencyRepository } from "../../../agency/adapters/PgAgencyRepository";
import { PgAssessmentRepository } from "../../../convention/adapters/PgAssessmentRepository";
import { PgConventionExternalIdRepository } from "../../../convention/adapters/PgConventionExternalIdRepository";
import { PgConventionQueries } from "../../../convention/adapters/PgConventionQueries";
import { PgConventionRepository } from "../../../convention/adapters/PgConventionRepository";
import { PgConventionsToSyncRepository } from "../../../convention/adapters/PgConventionsToSyncRepository";
import { PgDeletedEstablishmentRepository } from "../../../establishment/adapters/PgDeletedEstablishmentRepository";
import { PgDiscussionAggregateRepository } from "../../../establishment/adapters/PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "../../../establishment/adapters/PgEstablishmentAggregateRepository";
import { PgEstablishmentLeadQueries } from "../../../establishment/adapters/PgEstablishmentLeadQueries";
import { PgEstablishmentLeadRepository } from "../../../establishment/adapters/PgEstablishmentLeadRepository";
import { PgFormEstablishmentRepository } from "../../../establishment/adapters/PgFormEstablishmentRepository";
import { PgGroupRepository } from "../../../establishment/adapters/PgGroupRepository";
import { PgSearchMadeRepository } from "../../../establishment/adapters/PgSearchMadeRepository";
import { PgApiConsumerRepository } from "../../api-consumer/adapters/PgApiConsumerRepository";
import { PgAuthenticatedUserRepository } from "../../authentication/inclusion-connect/adapters/PgAuthenticatedUserRepository";
import { PgInclusionConnectedUserRepository } from "../../authentication/inclusion-connect/adapters/PgInclusionConnectedUserRepository";
import { PgOngoingOAuthRepository } from "../../authentication/inclusion-connect/adapters/PgOngoingOAuthRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../authentication/pe-connect/adapters/PgConventionPoleEmploiAdvisorRepository";
import { PgOutboxQueries } from "../../events/adapters/PgOutboxQueries";
import { PgOutboxRepository } from "../../events/adapters/PgOutboxRepository";
import { PgFeatureFlagRepository } from "../../feature-flags/adapters/PgFeatureFlagRepository";
import { PgNotificationRepository } from "../../notifications/adapters/PgNotificationRepository";
import { PgRomeRepository } from "../../rome/adapters/PgRomeRepository";
import { PgSavedErrorRepository } from "../../saved-errors/adapters/PgSavedErrorRepository";
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
    errorRepository: new PgSavedErrorRepository(transaction),
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
