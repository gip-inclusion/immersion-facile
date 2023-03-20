import {
  ConventionSignReminderPayload,
  conventionSignReminderPayloadSchema,
} from "../../../core/eventsPayloads/ConventionSignReminderPayload";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export class NotifyThatConventionStillNeedToBeSigned extends TransactionalUseCase<
  ConventionSignReminderPayload,
  void
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = conventionSignReminderPayloadSchema;

  protected async _execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { conventionId, type }: ConventionSignReminderPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uow: UnitOfWork,
  ) {
    return Promise.reject();
  }
}
