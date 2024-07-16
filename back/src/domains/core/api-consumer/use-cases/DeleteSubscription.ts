import {
  ApiConsumer,
  SubscriptionEvent,
  errors,
  findRightNameFromSubscriptionId,
  isApiConsumerAllowed,
} from "shared";
import { ForbiddenError, NotFoundError } from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export class DeleteSubscription extends TransactionalUseCase<
  string,
  void,
  ApiConsumer
> {
  protected inputSchema = z.string();

  protected async _execute(
    subscriptionId: SubscriptionEvent,
    uow: UnitOfWork,
    apiConsumer?: ApiConsumer,
  ): Promise<void> {
    if (!apiConsumer) throw errors.user.unauthorized();

    const subscribedRightName = findRightNameFromSubscriptionId(
      apiConsumer,
      subscriptionId,
    );

    if (!subscribedRightName)
      throw new NotFoundError(`subscription ${subscriptionId} not found`);

    if (
      !isApiConsumerAllowed({
        apiConsumer,
        rightName: subscribedRightName,
        consumerKind: "SUBSCRIPTION",
      })
    ) {
      throw new ForbiddenError(
        `You do not have the "SUBSCRIPTION" kind associated to the "${subscribedRightName}" right`,
      );
    }

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
