import { AgencyRepository } from "../../immersionApplication/ports/AgencyRepository";
import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { EstablishmentAggregateRepository } from "../../immersionOffer/ports/EstablishmentAggregateRepository";
import { ImmersionOutcomeRepository } from "../../immersionOutcome/ports/ImmersionOutcomeRepository";
import { RomeRepository } from "../../rome/ports/RomeRepository";
import { GetFeatureFlags } from "./GetFeatureFlags";
import { OutboxRepository } from "./OutboxRepository";
import { ImmersionApplicationRepository } from "../../immersionApplication/ports/ImmersionApplicationRepository";
import { ImmersionApplicationExportQueries } from "../../immersionApplication/ports/ImmersionApplicationExportQueries";
import { EstablishmentExportQueries } from "../../establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { OutboxQueries } from "./OutboxQueries";
import { ReportingGateway } from "./ReportingGateway";

export type UnitOfWork = {
  immersionOutcomeRepository: ImmersionOutcomeRepository;
  romeRepo: RomeRepository;
  outboxRepo: OutboxRepository;
  outboxQueries: OutboxQueries;
  agencyRepo: AgencyRepository;
  formEstablishmentRepo: FormEstablishmentRepository;
  establishmentAggregateRepo: EstablishmentAggregateRepository;
  immersionApplicationRepo: ImmersionApplicationRepository;
  establishmentExportQueries: EstablishmentExportQueries;
  immersionApplicationExportQueries: ImmersionApplicationExportQueries;
  postalCodeDepartmentRegionQueries: PostalCodeDepartmentRegionQueries;
  reportingGateway: ReportingGateway;
  getFeatureFlags: GetFeatureFlags;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
