import {
  ApiConsumer,
  WebhookSubscription,
  webhookSubscriptionSchema,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class SubscribeToWebhook extends TransactionalUseCase<
  WebhookSubscription,
  void,
  ApiConsumer
> {
  protected inputSchema = webhookSubscriptionSchema;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    webhookSubscription: WebhookSubscription,
    uow: UnitOfWork,
    payload: ApiConsumer,
  ) {
    if (!payload) throw new ForbiddenError("No JWT payload provided");

    await uow.apiConsumerRepository.addSubscription({
      subscription: webhookSubscription,
      apiConsumerId: payload.id,
    });

    await Promise.resolve(undefined);
  }
}
