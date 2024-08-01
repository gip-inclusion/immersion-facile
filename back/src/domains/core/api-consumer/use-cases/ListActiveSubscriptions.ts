import { keys } from "ramda";
import { ApiConsumer, WebhookSubscription } from "shared";
import { z } from "zod";
import { createTransactionalUseCase } from "../../UseCase";

export type ListActiveSubscriptions = ReturnType<
  typeof makeListActiveSubscriptions
>;

export const makeListActiveSubscriptions = createTransactionalUseCase<
  void,
  WebhookSubscription[],
  ApiConsumer
>(
  { name: "ListActiveSubscriptions", inputSchema: z.void() },
  ({ currentUser: apiConsumer }) => {
    const subscriptions = keys(apiConsumer.rights).flatMap(
      (rightName) => apiConsumer.rights[rightName].subscriptions,
    );
    return Promise.resolve(subscriptions);
  },
);
