import {
  ApiConsumer,
  ApiConsumerSubscriptionId,
  apiConsumerSubscriptionIdSchema,
  errors,
  findRightNameFromSubscriptionId,
  isApiConsumerAllowed,
} from "shared";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export class DeleteSubscription extends TransactionalUseCase<
  ApiConsumerSubscriptionId,
  void,
  ApiConsumer
> {
  protected inputSchema = apiConsumerSubscriptionIdSchema;

  protected async _execute(
    subscriptionId: ApiConsumerSubscriptionId,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<void> {
    if (!apiConsumer) throw errors.user.unauthorized();

    const subscribedRightName = findRightNameFromSubscriptionId(
      apiConsumer,
      subscriptionId,
    );

    if (!subscribedRightName)
      throw errors.apiConsumer.missing({ id: subscriptionId });

    if (
      !isApiConsumerAllowed({
        apiConsumer,
        rightName: subscribedRightName,
        consumerKind: "SUBSCRIPTION",
      })
    )
      throw errors.apiConsumer.missingRights({
        rightName: subscribedRightName,
      });

    const updatedSubscriptions = apiConsumer.rights[
      subscribedRightName
    ].subscriptions.filter(
      (subscription) => subscription.id !== subscriptionId,
    );

    await uow.apiConsumerRepository.save({
      ...apiConsumer,
      rights: {
        ...apiConsumer.rights,
        [subscribedRightName]: {
          ...apiConsumer.rights[subscribedRightName],
          subscriptions: updatedSubscriptions,
        },
      },
    });
  }
}
