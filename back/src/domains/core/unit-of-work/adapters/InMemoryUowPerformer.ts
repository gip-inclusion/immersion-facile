import { UnitOfWork } from "../ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";

export class InMemoryUowPerformer implements UnitOfWorkPerformer {
  constructor(private uow: UnitOfWork) {}

  public async perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return cb(this.uow);
  }

  // for test only
  public setUow(newUow: Partial<UnitOfWork>) {
    this.uow = { ...this.uow, ...newUow };
  }
}
