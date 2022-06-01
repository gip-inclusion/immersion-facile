import { ConventionPoleEmploiAdvisorRepository } from "../../peConnect/port/ConventionPoleEmploiAdvisorRepository";
import { AgencyRepository } from "../../convention/ports/AgencyRepository";
import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { EstablishmentAggregateRepository } from "../../immersionOffer/ports/EstablishmentAggregateRepository";
import { ImmersionAssessmentRepository } from "../../convention/ports/ImmersionAssessmentRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";
import { GetFeatureFlags } from "./GetFeatureFlags";
import { OutboxRepository } from "./OutboxRepository";
import { ConventionRepository } from "../../convention/ports/ConventionRepository";
import { ConventionQueries } from "../../convention/ports/ConventionQueries";
import { EstablishmentExportQueries } from "../../establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { OutboxQueries } from "./OutboxQueries";
import { ReportingGateway } from "./ReportingGateway";

export type UnitOfWork = {
  conventionPoleEmploiAdvisorRepo: ConventionPoleEmploiAdvisorRepository;
  immersionAssessmentRepository: ImmersionAssessmentRepository;
  romeRepo: RomeRepository;
  outboxRepo: OutboxRepository;
  outboxQueries: OutboxQueries;
  agencyRepo: AgencyRepository;
  formEstablishmentRepo: FormEstablishmentRepository;
  establishmentAggregateRepo: EstablishmentAggregateRepository;
  conventionRepository: ConventionRepository;
  conventionQueries: ConventionQueries;
  establishmentExportQueries: EstablishmentExportQueries;
  postalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries;
  reportingGateway: ReportingGateway;
  getFeatureFlags: GetFeatureFlags;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
