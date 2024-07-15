import { InMemoryAgencyGroupRepository } from "../../../agency/adapters/InMemoryAgencyGroupRepository";
import { InMemoryAgencyRepository } from "../../../agency/adapters/InMemoryAgencyRepository";
import { InMemoryDelegationContactRepository } from "../../../agency/adapters/InMemoryDelegationContactRepository";
import { InMemoryAssessmentRepository } from "../../../convention/adapters/InMemoryAssessmentRepository";
import { InMemoryConventionExternalIdRepository } from "../../../convention/adapters/InMemoryConventionExternalIdRepository";
import { InMemoryConventionQueries } from "../../../convention/adapters/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../convention/adapters/InMemoryConventionRepository";
import { InMemoryConventionsToSyncRepository } from "../../../convention/adapters/InMemoryConventionsToSyncRepository";
import { InMemoryNpsRepository } from "../../../convention/adapters/InMemoryNpsRepository";
import { InMemoryDeletedEstablishmentRepository } from "../../../establishment/adapters/InMemoryDeletedEstablishmentRepository";
import { InMemoryDiscussionRepository } from "../../../establishment/adapters/InMemoryDiscussionRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../../establishment/adapters/InMemoryEstablishmentAggregateRepository";
import { InMemoryEstablishmentLeadQueries } from "../../../establishment/adapters/InMemoryEstablishmentLeadQueries";
import { InMemoryEstablishmentLeadRepository } from "../../../establishment/adapters/InMemoryEstablishmentLeadRepository";
import { InMemoryFormEstablishmentRepository } from "../../../establishment/adapters/InMemoryFormEstablishmentRepository";
import { InMemoryGroupRepository } from "../../../establishment/adapters/InMemoryGroupRepository";
import { InMemorySearchMadeRepository } from "../../../establishment/adapters/InMemorySearchMadeRepository";
import { InMemoryApiConsumerRepository } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../authentication/inclusion-connect/adapters/InMemoryInclusionConnectedUserRepository";
import { InMemoryOngoingOAuthRepository } from "../../authentication/inclusion-connect/adapters/InMemoryOngoingOAuthRepository";
import { InMemoryUserRepository } from "../../authentication/inclusion-connect/adapters/InMemoryUserRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../authentication/pe-connect/adapters/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryOutboxQueries } from "../../events/adapters/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../events/adapters/InMemoryOutboxRepository";
import { InMemoryFeatureFlagRepository } from "../../feature-flags/adapters/InMemoryFeatureFlagRepository";
import { InMemoryNotificationRepository } from "../../notifications/adapters/InMemoryNotificationRepository";
import { InMemoryRomeRepository } from "../../rome/adapters/InMemoryRomeRepository";
import { InMemorySavedErrorRepository } from "../../saved-errors/adapters/InMemorySavedErrorRepository";
import { InMemoryShortLinkRepository } from "../../short-link/adapters/short-link-repository/InMemoryShortLinkRepository";
import { InMemoryStatisticQueries } from "../../statistics/adapters/InMemoryStatisticQueries";
import { UnitOfWork } from "../ports/UnitOfWork";

export const createInMemoryUow = () => {
  const outboxRepository = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
  const agencyRepository = new InMemoryAgencyRepository();
  const conventionRepository = new InMemoryConventionRepository();
  const notificationRepository = new InMemoryNotificationRepository();
  const conventionQueries = new InMemoryConventionQueries(
    conventionRepository,
    agencyRepository,
    notificationRepository,
  );
  const userRepository = new InMemoryUserRepository();
  const shortLinkRepository = new InMemoryShortLinkRepository();
  const establishmentLeadRepository = new InMemoryEstablishmentLeadRepository();

  return {
    agencyRepository,
    agencyGroupRepository: new InMemoryAgencyGroupRepository(),
    apiConsumerRepository: new InMemoryApiConsumerRepository(),
    userRepository,
    conventionQueries,
    conventionRepository,
    conventionPoleEmploiAdvisorRepository:
      new InMemoryConventionPoleEmploiAdvisorRepository(),
    conventionsToSyncRepository: new InMemoryConventionsToSyncRepository(),
    delegationContactRepository: new InMemoryDelegationContactRepository(),
    discussionRepository: new InMemoryDiscussionRepository(),
    establishmentAggregateRepository:
      new InMemoryEstablishmentAggregateRepository(),
    groupRepository: new InMemoryGroupRepository(),
    errorRepository: new InMemorySavedErrorRepository(),
    featureFlagRepository: new InMemoryFeatureFlagRepository(),
    formEstablishmentRepository: new InMemoryFormEstablishmentRepository(),
    assessmentRepository: new InMemoryAssessmentRepository(),
    inclusionConnectedUserRepository:
      new InMemoryInclusionConnectedUserRepository(userRepository),
    establishmentLeadRepository,
    establishmentLeadQueries: new InMemoryEstablishmentLeadQueries(
      establishmentLeadRepository,
      conventionQueries,
    ),
    notificationRepository,
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
    npsRepository: new InMemoryNpsRepository(),
    statisticQueries: new InMemoryStatisticQueries(),
  } satisfies UnitOfWork;
};

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;
