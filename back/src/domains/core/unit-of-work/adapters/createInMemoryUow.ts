import { InMemoryAgencyGroupRepository } from "../../../../adapters/secondary/InMemoryAgencyGroupRepository";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryAssessmentRepository } from "../../../../adapters/secondary/InMemoryAssessmentRepository";
import { InMemoryAuthenticatedUserRepository } from "../../../../adapters/secondary/InMemoryAuthenticatedUserRepository";
import { InMemoryConventionExternalIdRepository } from "../../../../adapters/secondary/InMemoryConventionExternalIdRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryConventionQueries } from "../../../../adapters/secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryConventionsToSyncRepository } from "../../../../adapters/secondary/InMemoryConventionsToSyncRepository";
import { InMemoryDeletedEstablishmentRepository } from "../../../../adapters/secondary/InMemoryDeletedEstablishmentRepository";
import { InMemoryEstablishmentLeadQueries } from "../../../../adapters/secondary/InMemoryEstablishmentLeadQueries";
import { InMemoryFormEstablishmentRepository } from "../../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryInclusionConnectedUserRepository } from "../../../../adapters/secondary/InMemoryInclusionConnectedUserRepository";
import { InMemoryNotificationRepository } from "../../../../adapters/secondary/InMemoryNotificationRepository";
import { InMemoryOngoingOAuthRepository } from "../../../../adapters/secondary/InMemoryOngoingOAuthRepository";
import { InMemoryRomeRepository } from "../../../../adapters/secondary/InMemoryRomeRepository";
import { InMemoryErrorRepository } from "../../../../adapters/secondary/core/InMemoryErrorRepository";
import { InMemoryDiscussionAggregateRepository } from "../../../../adapters/secondary/offer/InMemoryDiscussionAggregateRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../../../adapters/secondary/offer/InMemoryEstablishmentAggregateRepository";
import { InMemoryEstablishmentLeadRepository } from "../../../../adapters/secondary/offer/InMemoryEstablishmentLeadRepository";
import { InMemoryGroupRepository } from "../../../../adapters/secondary/offer/InMemoryGroupRepository";
import { InMemorySearchMadeRepository } from "../../../../adapters/secondary/offer/InMemorySearchMadeRepository";
import { InMemoryApiConsumerRepository } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryOutboxQueries } from "../../events/adapters/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../events/adapters/InMemoryOutboxRepository";
import { InMemoryFeatureFlagRepository } from "../../feature-flags/adapters/InMemoryFeatureFlagRepository";
import { InMemoryShortLinkRepository } from "../../short-link/adapters/short-link-repository/InMemoryShortLinkRepository";
import { UnitOfWork } from "../ports/UnitOfWork";

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

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;
