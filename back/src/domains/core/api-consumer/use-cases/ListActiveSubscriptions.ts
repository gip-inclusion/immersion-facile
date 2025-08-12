import { keys } from "ramda";
import type { ApiConsumer, WebhookSubscription } from "shared";
import { z } from "zod/v4";
import { useCaseBuilder } from "../../useCaseBuilder";

export type ListActiveSubscriptions = ReturnType<
  typeof makeListActiveSubscriptions
>;

export const makeListActiveSubscriptions = useCaseBuilder(
  "ListActiveSubscriptions",
)
  .withInput<void>(z.void())
  .withOutput<WebhookSubscription[]>()
  .withCurrentUser<ApiConsumer>()
  .build(({ currentUser: apiConsumer }) => {
    const subscriptions = keys(apiConsumer.rights).flatMap(
      (rightName) => apiConsumer.rights[rightName].subscriptions,
    );
    return Promise.resolve(subscriptions);
  });
