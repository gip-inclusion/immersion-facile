import { FormEstablishmentRepository } from "../../immersionOffer/ports/FormEstablishmentRepository";
import { OutboxRepository } from "./OutboxRepository";

export type UnitOfWork = {
  outboxRepo: OutboxRepository;
  formEstablishmentRepo: FormEstablishmentRepository;
};

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
