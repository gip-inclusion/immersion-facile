import { InMemoryAgencyGroupRepository } from "../../../agency/adapters/InMemoryAgencyGroupRepository";
import { InMemoryAgencyRepository } from "../../../agency/adapters/InMemoryAgencyRepository";
import { InMemoryDelegationContactRepository } from "../../../agency/adapters/InMemoryDelegationContactRepository";
import { InMemoryAssessmentRepository } from "../../../convention/adapters/InMemoryAssessmentRepository";
import { InMemoryConventionDraftRepository } from "../../../convention/adapters/InMemoryConventionDraftRepository";
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
import { InMemoryGroupRepository } from "../../../establishment/adapters/InMemoryGroupRepository";
import { InMemorySearchMadeRepository } from "../../../establishment/adapters/InMemorySearchMadeRepository";
import { InMemoryEstablishementMarketingRepository } from "../../../marketing/adapters/InMemoryEstablishmentMarketingRepository";
import { InMemoryApiConsumerRepository } from "../../api-consumer/adapters/InMemoryApiConsumerRepository";
import { InMemoryOngoingOAuthRepository } from "../../authentication/connected-user/adapters/InMemoryOngoingOAuthRepository";
import { InMemoryUserRepository } from "../../authentication/connected-user/adapters/InMemoryUserRepository";
import { InMemoryConventionFranceTravailAdvisorRepository } from "../../authentication/ft-connect/adapters/InMemoryConventionFranceTravailAdvisorRepository";
import { InMemoryOutboxQueries } from "../../events/adapters/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../events/adapters/InMemoryOutboxRepository";
import { InMemoryFeatureFlagQueries } from "../../feature-flags/adapters/InMemoryFeatureFlagQueries";
import { InMemoryFeatureFlagRepository } from "../../feature-flags/adapters/InMemoryFeatureFlagRepository";
import { InMemoryNafRepository } from "../../naf/adapters/InMemoryNafRepository";
import { InMemoryNotificationRepository } from "../../notifications/adapters/InMemoryNotificationRepository";
import { InMemoryRomeRepository } from "../../rome/adapters/InMemoryRomeRepository";
import { InMemoryBroadcastFeedbacksRepository } from "../../saved-errors/adapters/InMemoryBroadcastFeedbacksRepository";
import { InMemoryShortLinkRepository } from "../../short-link/adapters/short-link-repository/InMemoryShortLinkRepository";
import { InMemoryStatisticQueries } from "../../statistics/adapters/InMemoryStatisticQueries";
import type { OutOfTransactionQueries, UnitOfWork } from "../ports/UnitOfWork";

export const createInMemoryUow = () => {
  const outboxRepository = new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepository);
  const agencyRepository = new InMemoryAgencyRepository();
  const conventionRepository = new InMemoryConventionRepository();
  const notificationRepository = new InMemoryNotificationRepository();
  const userRepository = new InMemoryUserRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const broadcastFeedbacksRepository =
    new InMemoryBroadcastFeedbacksRepository();
  const conventionQueries = new InMemoryConventionQueries(
    conventionRepository,
    agencyRepository,
    userRepository,
    assessmentRepository,
    broadcastFeedbacksRepository,
  );
  const featureFlagRepository = new InMemoryFeatureFlagRepository();

  const shortLinkRepository = new InMemoryShortLinkRepository();
  const establishmentLeadRepository = new InMemoryEstablishmentLeadRepository();

  return {
    agencyRepository,
    agencyGroupRepository: new InMemoryAgencyGroupRepository(),
    apiConsumerRepository: new InMemoryApiConsumerRepository(),
    userRepository,
    broadcastFeedbacksRepository,
    conventionQueries,
    conventionRepository,
    conventionFranceTravailAdvisorRepository:
      new InMemoryConventionFranceTravailAdvisorRepository(),
    conventionsToSyncRepository: new InMemoryConventionsToSyncRepository(),
    delegationContactRepository: new InMemoryDelegationContactRepository(),
    discussionRepository: new InMemoryDiscussionRepository({}, userRepository),
    establishmentAggregateRepository:
      new InMemoryEstablishmentAggregateRepository(),
    groupRepository: new InMemoryGroupRepository(),
    featureFlagRepository: featureFlagRepository,
    featureFlagQueries: new InMemoryFeatureFlagQueries(featureFlagRepository),
    assessmentRepository,
    conventionDraftRepository: new InMemoryConventionDraftRepository(),
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
    establishmentMarketingRepository:
      new InMemoryEstablishementMarketingRepository(),
    nafRepository: new InMemoryNafRepository(),
  } satisfies UnitOfWork;
};

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;

export const createInMemoryOutOfTransactionQueries = (
  uow: InMemoryUnitOfWork,
): OutOfTransactionQueries => ({
  convention: uow.conventionQueries,
  establishmentLead: uow.establishmentLeadQueries,
  shortLink: uow.shortLinkQuery,
  featureFlag: uow.featureFlagQueries,
  statistic: uow.statisticQueries,
});
