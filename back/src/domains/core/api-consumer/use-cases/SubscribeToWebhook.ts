import {
  type ApiConsumer,
  createWebhookSubscriptionSchema,
  errors,
  eventToRightName,
  type WebhookSubscription,
} from "shared";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";

export type SubscribeToWebhook = ReturnType<typeof makeSubscribeToWebhook>;

export const makeSubscribeToWebhook = useCaseBuilder("SubscribeToWebhook")
  .withInput(createWebhookSubscriptionSchema)
  .withCurrentUser<ApiConsumer>()
  .withDeps<{
    uuidGenerator: UuidGenerator;
    timeGateway: TimeGateway;
  }>()
  .build(async ({ currentUser, inputParams, uow, deps }) => {
    if (!currentUser) throw errors.user.noJwtProvided();

    const rightName = eventToRightName(inputParams.subscribedEvent);

    const newSubscription: WebhookSubscription = {
      ...inputParams,
      createdAt: deps.timeGateway.now().toISOString(),
      id: deps.uuidGenerator.new(),
    };

    await uow.apiConsumerRepository.save({
      ...currentUser,
      rights: {
        ...currentUser.rights,
        [rightName]: {
          ...currentUser.rights[rightName],
          subscriptions: [
            ...currentUser.rights[rightName].subscriptions,
            newSubscription,
          ],
        },
      },
    });
  });
