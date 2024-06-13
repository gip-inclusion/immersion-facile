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
  { useCaseName: "ListActiveSubscriptions", inputSchema: z.void() },
  (_, _uow, apiConsumer) => {
    const subscriptions = keys(apiConsumer.rights).flatMap(
      (rightName) => apiConsumer.rights[rightName].subscriptions,
    );
    return Promise.resolve(subscriptions);
  },
);
