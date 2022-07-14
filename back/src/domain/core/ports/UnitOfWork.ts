import { AgencyRepository } from "../../convention/ports/AgencyRepository";
import { ConventionQueries } from "../../convention/ports/ConventionQueries";
import { ConventionRepository } from "../../convention/ports/ConventionRepository";
import { ImmersionAssessmentRepository } from "../../convention/ports/ImmersionAssessmentRepository";
import { EstablishmentExportQueries } from "../../establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { EstablishmentAggregateRepository } from "../../immersionOffer/ports/EstablishmentAggregateRepository";
import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { LaBonneBoiteRequestRepository } from "../../immersionOffer/ports/LaBonneBoiteRequestRepository";
import { SearchMadeRepository } from "../../immersionOffer/ports/SearchMadeRepository";
import { ConventionPoleEmploiAdvisorRepository } from "../../peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";
import { GetApiConsumerById } from "./GetApiConsumerById";
import { GetFeatureFlags } from "./GetFeatureFlags";
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
  establishmentExportQueries: EstablishmentExportQueries;
  postalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries;
  getFeatureFlags: GetFeatureFlags;
  laBonneBoiteRequestRepository: LaBonneBoiteRequestRepository;
  searchMadeRepository: SearchMadeRepository;
  getApiConsumersById: GetApiConsumerById;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
