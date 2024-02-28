import {
  ApiConsumer,
  SubscriptionEvent,
  findRightNameFromSubscriptionId,
  isApiConsumerAllowed,
} from "shared";
import { z } from "zod";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

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
    if (!apiConsumer) throw new UnauthorizedError();

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
