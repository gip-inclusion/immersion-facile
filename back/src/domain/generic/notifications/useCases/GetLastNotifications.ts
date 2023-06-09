import { z } from "zod";
import { NotificationsByKind } from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
export class GetLastNotifications extends TransactionalUseCase<
  void,
  NotificationsByKind
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = z.void();

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _execute(
    _: void,
    uow: UnitOfWork,
  ): Promise<NotificationsByKind> {
    return uow.notificationRepository.getLastNotifications();
  }
}
