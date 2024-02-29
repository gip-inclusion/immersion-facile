import { AgencyGroupRepository } from "../../../convention/ports/AgencyGroupRepository";
import { AgencyRepository } from "../../../convention/ports/AgencyRepository";
import { AssessmentRepository } from "../../../convention/ports/AssessmentRepository";
import { ConventionExternalIdRepository } from "../../../convention/ports/ConventionExternalIdRepository";
import { ConventionQueries } from "../../../convention/ports/ConventionQueries";
import { ConventionRepository } from "../../../convention/ports/ConventionRepository";
import { ConventionsToSyncRepository } from "../../../convention/ports/ConventionsToSyncRepository";
import { DeletedEstablishmentRepository } from "../../../offer/ports/DeletedEstablishmentRepository";
import { DiscussionAggregateRepository } from "../../../offer/ports/DiscussionAggregateRepository";
import { EstablishmentAggregateRepository } from "../../../offer/ports/EstablishmentAggregateRepository";
import { EstablishmentLeadQueries } from "../../../offer/ports/EstablishmentLeadQueries";
import { EstablishmentLeadRepository } from "../../../offer/ports/EstablishmentLeadRepository";
import { FormEstablishmentRepository } from "../../../offer/ports/FormEstablishmentRepository";
import { GroupRepository } from "../../../offer/ports/GroupRepository";
import { SearchMadeRepository } from "../../../offer/ports/SearchMadeRepository";
import { ApiConsumerRepository } from "../../api-consumer/ports/ApiConsumerRepository";
import { AuthenticatedUserRepository } from "../../authentication/inclusion-connect/port/AuthenticatedUserRepositiory";
import { OngoingOAuthRepository } from "../../authentication/inclusion-connect/port/OngoingOAuthRepositiory";
import { ConventionPoleEmploiAdvisorRepository } from "../../authentication/pe-connect/port/ConventionPoleEmploiAdvisorRepository";
import { InclusionConnectedUserRepository } from "../../dashboard/port/InclusionConnectedUserRepository";
import { OutboxQueries } from "../../events/ports/OutboxQueries";
import { OutboxRepository } from "../../events/ports/OutboxRepository";
import { FeatureFlagRepository } from "../../feature-flags/ports/FeatureFlagRepository";
import { NotificationRepository } from "../../notifications/ports/NotificationRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";
import { SavedErrorRepository } from "../../saved-errors/ports/SavedErrorRepository";
import { ShortLinkQuery } from "../../short-link/ports/ShortLinkQuery";
import { ShortLinkRepository } from "../../short-link/ports/ShortLinkRepository";

export type UnitOfWork = {
  agencyRepository: AgencyRepository;
  agencyGroupRepository: AgencyGroupRepository;
  apiConsumerRepository: ApiConsumerRepository;
  authenticatedUserRepository: AuthenticatedUserRepository;
  conventionPoleEmploiAdvisorRepository: ConventionPoleEmploiAdvisorRepository;
  conventionExternalIdRepository: ConventionExternalIdRepository;
  conventionQueries: ConventionQueries;
  conventionRepository: ConventionRepository;
  conventionsToSyncRepository: ConventionsToSyncRepository;
  deletedEstablishmentRepository: DeletedEstablishmentRepository;
  discussionAggregateRepository: DiscussionAggregateRepository;
  errorRepository: SavedErrorRepository;
  establishmentAggregateRepository: EstablishmentAggregateRepository;
  establishmentLeadRepository: EstablishmentLeadRepository;
  groupRepository: GroupRepository;
  featureFlagRepository: FeatureFlagRepository;
  formEstablishmentRepository: FormEstablishmentRepository;
  assessmentRepository: AssessmentRepository;
  inclusionConnectedUserRepository: InclusionConnectedUserRepository;
  notificationRepository: NotificationRepository;
  ongoingOAuthRepository: OngoingOAuthRepository;
  outboxQueries: OutboxQueries;
  outboxRepository: OutboxRepository;
  romeRepository: RomeRepository;
  searchMadeRepository: SearchMadeRepository;
  shortLinkQuery: ShortLinkQuery;
  shortLinkRepository: ShortLinkRepository;
  establishmentLeadQueries: EstablishmentLeadQueries;
};