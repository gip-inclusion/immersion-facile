import { ApiConsumerRepository } from "../../auth/ports/ApiConsumerRepository";
import { AgencyRepository } from "../../convention/ports/AgencyRepository";
import { ConventionExternalIdRepository } from "../../convention/ports/ConventionExternalIdRepository";
import { ConventionQueries } from "../../convention/ports/ConventionQueries";
import { ConventionRepository } from "../../convention/ports/ConventionRepository";
import { ConventionsToSyncRepository } from "../../convention/ports/ConventionsToSyncRepository";
import { ImmersionAssessmentRepository } from "../../convention/ports/ImmersionAssessmentRepository";
import { InclusionConnectedUserRepository } from "../../dashboard/port/InclusionConnectedUserRepository";
import { NotificationRepository } from "../../generic/notifications/ports/NotificationRepository";
import { AuthenticatedUserRepository } from "../../generic/OAuth/ports/AuthenticatedUserRepositiory";
import { OngoingOAuthRepository } from "../../generic/OAuth/ports/OngoingOAuthRepositiory";
import { DeletedEstablishmentRepository } from "../../offer/ports/DeletedEstablishmentRepository";
import { DiscussionAggregateRepository } from "../../offer/ports/DiscussionAggregateRepository";
import { EstablishmentAggregateRepository } from "../../offer/ports/EstablishmentAggregateRepository";
import { EstablishmentGroupRepository } from "../../offer/ports/EstablishmentGroupRepository";
import { FormEstablishmentRepository } from "../../offer/ports/FormEstablishmentRepository";
import { SearchMadeRepository } from "../../offer/ports/SearchMadeRepository";
import { ConventionPoleEmploiAdvisorRepository } from "../../peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";
import { ErrorRepository } from "./ErrorRepository";
import { FeatureFlagRepository } from "./FeatureFlagRepository";
import { OutboxQueries } from "./OutboxQueries";
import { OutboxRepository } from "./OutboxRepository";
import { ShortLinkQuery } from "./ShortLinkQuery";
import { ShortLinkRepository } from "./ShortLinkRepository";

export type UnitOfWork = {
  agencyRepository: AgencyRepository;
  apiConsumerRepository: ApiConsumerRepository;
  authenticatedUserRepository: AuthenticatedUserRepository;
  conventionPoleEmploiAdvisorRepository: ConventionPoleEmploiAdvisorRepository;
  conventionExternalIdRepository: ConventionExternalIdRepository;
  conventionQueries: ConventionQueries;
  conventionRepository: ConventionRepository;
  conventionsToSyncRepository: ConventionsToSyncRepository;
  deletedEstablishmentRepository: DeletedEstablishmentRepository;
  discussionAggregateRepository: DiscussionAggregateRepository;
  errorRepository: ErrorRepository;
  establishmentAggregateRepository: EstablishmentAggregateRepository;
  establishmentGroupRepository: EstablishmentGroupRepository;
  featureFlagRepository: FeatureFlagRepository;
  formEstablishmentRepository: FormEstablishmentRepository;
  immersionAssessmentRepository: ImmersionAssessmentRepository;
  inclusionConnectedUserRepository: InclusionConnectedUserRepository;
  notificationRepository: NotificationRepository;
  ongoingOAuthRepository: OngoingOAuthRepository;
  outboxQueries: OutboxQueries;
  outboxRepository: OutboxRepository;
  romeRepository: RomeRepository;
  searchMadeRepository: SearchMadeRepository;
  shortLinkQuery: ShortLinkQuery;
  shortLinkRepository: ShortLinkRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
