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
import { LaBonneBoiteRequestRepository } from "../../immersionOffer/ports/LaBonneBoiteRequestRepository";
import { SearchMadeRepository } from "../../immersionOffer/ports/SearchMadeRepository";
import { ConventionPoleEmploiAdvisorRepository } from "../../peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";

import { FeatureFlagRepository } from "./FeatureFlagRepository";
import { OutboxQueries } from "./OutboxQueries";
import { OutboxRepository } from "./OutboxRepository";

export type UnitOfWork = {
  conventionPoleEmploiAdvisorRepository: ConventionPoleEmploiAdvisorRepository;
  immersionAssessmentRepository: ImmersionAssessmentRepository;
  inclusionConnectedUserRepository: InclusionConnectedUserRepository;
  romeRepository: RomeRepository;
  outboxRepository: OutboxRepository;
  outboxQueries: OutboxQueries;
  agencyRepository: AgencyRepository;
  formEstablishmentRepository: FormEstablishmentRepository;
  establishmentGroupRepository: EstablishmentGroupRepository;
  establishmentAggregateRepository: EstablishmentAggregateRepository;
  conventionRepository: ConventionRepository;
  conventionQueries: ConventionQueries;
  postalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries;
  featureFlagRepository: FeatureFlagRepository;
  laBonneBoiteRequestRepository: LaBonneBoiteRequestRepository;
  searchMadeRepository: SearchMadeRepository;
  apiConsumerRepository: ApiConsumerRepository;
  exportQueries: ExportQueries;
  discussionAggregateRepository: DiscussionAggregateRepository;
  authenticatedUserRepository: AuthenticatedUserRepository;
  ongoingOAuthRepository: OngoingOAuthRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
