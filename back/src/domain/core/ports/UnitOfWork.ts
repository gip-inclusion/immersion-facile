import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { ImmersionOfferRepository } from "../../immersionOffer/ports/ImmersionOfferRepository";
import { OutboxRepository } from "./OutboxRepository";

export type UnitOfWork = {
  outboxRepo: OutboxRepository;
  formEstablishmentRepo: FormEstablishmentRepository;
  immersionOfferRepo: ImmersionOfferRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
