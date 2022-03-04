import { AgencyRepository } from "../../immersionApplication/ports/AgencyRepository";
import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { ImmersionOfferRepository } from "../../immersionOffer/ports/ImmersionOfferRepository";
import { GetFeatureFlags } from "./GetFeatureFlags";
import { OutboxRepository } from "./OutboxRepository";
import { ImmersionApplicationRepository } from "../../immersionApplication/ports/ImmersionApplicationRepository";
import { ImmersionApplicationExportQueries } from "../../immersionApplication/ports/ImmersionApplicationExportQueries";

export type UnitOfWork = {
  outboxRepo: OutboxRepository;
  agencyRepo: AgencyRepository;
  formEstablishmentRepo: FormEstablishmentRepository;
  immersionOfferRepo: ImmersionOfferRepository;
  immersionApplicationRepo: ImmersionApplicationRepository;
  immersionApplicationExportRepo: ImmersionApplicationExportQueries;
  getFeatureFlags: GetFeatureFlags;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
