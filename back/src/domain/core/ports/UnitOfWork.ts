import { ApiConsumerRepository } from "../../auth/ports/ApiConsumerRepository";
import { ExportQueries } from "../../backoffice/ports/ExportQueries";
import { AgencyRepository } from "../../convention/ports/AgencyRepository";
import { ConventionQueries } from "../../convention/ports/ConventionQueries";
import { ConventionRepository } from "../../convention/ports/ConventionRepository";
import { ImmersionAssessmentRepository } from "../../convention/ports/ImmersionAssessmentRepository";
import { InclusionConnectedUserRepository } from "../../dashboard/port/InclusionConnectedUserRepository";
import { PostalCodeDepartmentRegionQueries } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { AuthenticatedUserRepository } from "../../generic/OAuth/ports/AuthenticatedUserRepositiory";
import { OngoingOAuthRepository } from "../../generic/OAuth/ports/OngoingOAuthRepositiory";
import { DiscussionAggregateRepository } from "../../immersionOffer/ports/DiscussionAggregateRepository";
import { EstablishmentAggregateRepository } from "../../immersionOffer/ports/EstablishmentAggregateRepository";
import { EstablishmentGroupRepository } from "../../immersionOffer/ports/EstablishmentGroupRepository";
import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { SearchMadeRepository } from "../../immersionOffer/ports/SearchMadeRepository";
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
  conventionQueries: ConventionQueries;
  conventionRepository: ConventionRepository;
  discussionAggregateRepository: DiscussionAggregateRepository;
  errorRepository: ErrorRepository;
  establishmentAggregateRepository: EstablishmentAggregateRepository;
  establishmentGroupRepository: EstablishmentGroupRepository;
  exportQueries: ExportQueries;
  featureFlagRepository: FeatureFlagRepository;
  formEstablishmentRepository: FormEstablishmentRepository;
  immersionAssessmentRepository: ImmersionAssessmentRepository;
  inclusionConnectedUserRepository: InclusionConnectedUserRepository;
  ongoingOAuthRepository: OngoingOAuthRepository;
  outboxQueries: OutboxQueries;
  outboxRepository: OutboxRepository;
  postalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries;
  romeRepository: RomeRepository;
  searchMadeRepository: SearchMadeRepository;
  shortLinkQuery: ShortLinkQuery;
  shortLinkRepository: ShortLinkRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
