import { UnitOfWork } from "./UnitOfWork";

export interface UnitOfWorkPerformer {
  perform: <T>(cb: (uow: UnitOfWork) => Promise<T>) => Promise<T>;
}
