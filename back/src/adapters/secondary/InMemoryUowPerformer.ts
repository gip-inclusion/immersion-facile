import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../domain/core/ports/UnitOfWork";

export class InMemoryUowPerformer implements UnitOfWorkPerformer {
  constructor(private uow: UnitOfWork) {}

  public async perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    console.log("IN UOW performer");
    return cb(this.uow);
  }
}
