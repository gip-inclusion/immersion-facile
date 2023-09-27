import { keys } from "ramda";
import { z } from "zod";
import { ApiConsumer, WebhookSubscription } from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListActiveSubscriptions extends TransactionalUseCase<
  void,
  WebhookSubscription[],
  ApiConsumer
> {
  protected inputSchema = z.void();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    _: void,
    _uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<WebhookSubscription[]> {
    if (!apiConsumer) throw new ForbiddenError();

    const subscriptions = keys(apiConsumer.rights).flatMap(
      (rightName) => apiConsumer.rights[rightName].subscriptions,
    );
    return Promise.resolve(subscriptions);
  }
}
