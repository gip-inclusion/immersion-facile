import { z } from "zod";
import {
  ApiConsumer,
  findRightNameFromSubscriptionId,
  isApiConsumerAllowed,
  SubscriptionEvent,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class DeleteSubscription extends TransactionalUseCase<
  string,
  void,
  ApiConsumer
> {
  protected inputSchema = z.string();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

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
