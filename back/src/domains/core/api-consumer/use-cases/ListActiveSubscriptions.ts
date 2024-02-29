import { keys } from "ramda";
import { ApiConsumer, WebhookSubscription } from "shared";
import { z } from "zod";
import { ForbiddenError } from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export class ListActiveSubscriptions extends TransactionalUseCase<
  void,
  WebhookSubscription[],
  ApiConsumer
> {
  protected inputSchema = z.void();

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
