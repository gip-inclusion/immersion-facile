import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../adapters/primary/config";

export const makeCreateInMemoryUow =
  (uow: Partial<InMemoryUnitOfWork> = {}) =>
  (): InMemoryUnitOfWork => ({ ...createInMemoryUow(), ...uow });
