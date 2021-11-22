import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../domain/core/ports/UnitOfWork";

export class InMemoryUowPerformer implements UnitOfWorkPerformer {
  constructor(private createInMemoryUnitOfWork: () => UnitOfWork) {}

  public async perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return cb(this.createInMemoryUnitOfWork());
  }
}
