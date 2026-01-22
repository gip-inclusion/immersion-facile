import {
  type ApiConsumer,
  type ApiConsumerSubscriptionId,
  apiConsumerSubscriptionIdSchema,
  errors,
  findRightNameFromSubscriptionId,
  isApiConsumerAllowed,
} from "shared";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";

export class DeleteSubscription extends TransactionalUseCase<
  ApiConsumerSubscriptionId,
  void,
  ApiConsumer
> {
  protected inputSchema = apiConsumerSubscriptionIdSchema;

  #timeGateway: TimeGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, timeGateway: TimeGateway) {
    super(uowPerformer);
    this.#timeGateway = timeGateway;
  }

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

    const apiConsumerPhoneId =
      await uow.phoneNumberRepository.getIdByPhoneNumber(
        apiConsumer.contact.phone,
        this.#timeGateway.now(),
      );

    await uow.apiConsumerRepository.save({
      apiConsumer: {
        ...apiConsumer,
        rights: {
          ...apiConsumer.rights,
          [subscribedRightName]: {
            ...apiConsumer.rights[subscribedRightName],
            subscriptions: updatedSubscriptions,
          },
        },
      },
      phoneId: apiConsumerPhoneId,
    });
  }
}
