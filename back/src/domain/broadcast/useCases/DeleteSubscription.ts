import { z } from "zod";
import {
  ApiConsumer,
  eventToRightName,
  findSubscribedEventFromId,
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

    const eventToDelete = findSubscribedEventFromId(
      apiConsumer,
      subscriptionId,
    );

    if (!eventToDelete)
      throw new NotFoundError(`subscription ${subscriptionId} not found`);
    const rightName = eventToRightName(eventToDelete);
    if (
      !isApiConsumerAllowed({
        apiConsumer,
        rightName,
        consumerKind: "SUBSCRIPTION",
      })
    ) {
      throw new ForbiddenError(
        `You do not have the "SUBSCRIPTION" kind associated to the "${rightName}" right`,
      );
    }

    const updatedSubscriptions = apiConsumer.rights[
      rightName
    ].subscriptions.filter(
      (subscription) => subscription.subscribedEvent !== eventToDelete,
    );

    await uow.apiConsumerRepository.save({
      ...apiConsumer,
      rights: {
        ...apiConsumer.rights,
        [rightName]: {
          ...apiConsumer.rights[rightName],
          subscriptions: updatedSubscriptions,
        },
      },
    });
  }
}
