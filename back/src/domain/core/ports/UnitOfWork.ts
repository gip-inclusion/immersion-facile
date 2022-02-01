import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { ImmersionOfferRepository } from "../../immersionOffer/ports/ImmersionOfferRepository";
import { OutboxRepository } from "./OutboxRepository";
import { ImmersionApplicationRepository } from "../../immersionApplication/ports/ImmersionApplicationRepository";

export type UnitOfWork = {
  outboxRepo: OutboxRepository;
  formEstablishmentRepo: FormEstablishmentRepository;
  immersionOfferRepo: ImmersionOfferRepository;
  immersionApplicationRepo: ImmersionApplicationRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
