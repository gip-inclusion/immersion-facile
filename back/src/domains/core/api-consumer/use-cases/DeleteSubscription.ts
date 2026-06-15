import {
  type ApiConsumer,
  apiConsumerSubscriptionIdSchema,
  errors,
  findRightNameFromSubscriptionId,
  isApiConsumerAllowed,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";

export type DeleteSubscription = ReturnType<typeof makeDeleteSubscription>;

export const makeDeleteSubscription = useCaseBuilder("DeleteSubscription")
  .withInput(apiConsumerSubscriptionIdSchema)
  .withCurrentUser<ApiConsumer>()
  .build(
    async ({ currentUser: apiConsumer, inputParams: subscriptionId, uow }) => {
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
    },
  );
