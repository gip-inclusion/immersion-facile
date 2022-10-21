import { ExportQueries } from "../../backoffice/ports/ExportQueries";
import { AgencyRepository } from "../../convention/ports/AgencyRepository";
import { ConventionQueries } from "../../convention/ports/ConventionQueries";
import { ConventionRepository } from "../../convention/ports/ConventionRepository";
import { ImmersionAssessmentRepository } from "../../convention/ports/ImmersionAssessmentRepository";
import { PostalCodeDepartmentRegionQueries } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { DiscussionAggregateRepository } from "../../immersionOffer/ports/DiscussionAggregateRepository";
import { EstablishmentAggregateRepository } from "../../immersionOffer/ports/EstablishmentAggregateRepository";
import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { LaBonneBoiteRequestRepository } from "../../immersionOffer/ports/LaBonneBoiteRequestRepository";
import { SearchMadeRepository } from "../../immersionOffer/ports/SearchMadeRepository";
import { ConventionPoleEmploiAdvisorRepository } from "../../peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";
import { FeatureFlagRepository } from "./FeatureFlagRepository";
import { GetApiConsumerById } from "./GetApiConsumerById";
import { OutboxQueries } from "./OutboxQueries";
import { OutboxRepository } from "./OutboxRepository";

export type UnitOfWork = {
  conventionPoleEmploiAdvisorRepository: ConventionPoleEmploiAdvisorRepository;
  immersionAssessmentRepository: ImmersionAssessmentRepository;
  romeRepository: RomeRepository;
  outboxRepository: OutboxRepository;
  outboxQueries: OutboxQueries;
  agencyRepository: AgencyRepository;
  formEstablishmentRepository: FormEstablishmentRepository;
  establishmentAggregateRepository: EstablishmentAggregateRepository;
  conventionRepository: ConventionRepository;
  conventionQueries: ConventionQueries;
  postalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries;
  featureFlagRepository: FeatureFlagRepository;
  laBonneBoiteRequestRepository: LaBonneBoiteRequestRepository;
  searchMadeRepository: SearchMadeRepository;
  getApiConsumersById: GetApiConsumerById;
  exportQueries: ExportQueries;
  discussionAggregateRepository: DiscussionAggregateRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
