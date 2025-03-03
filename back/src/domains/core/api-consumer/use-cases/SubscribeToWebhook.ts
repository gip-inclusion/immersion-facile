import {
  ApiConsumer,
  CreateWebhookSubscription,
  WebhookSubscription,
  createWebhookSubscriptionSchema,
  errors,
  eventToRightName,
} from "shared";
import { TransactionalUseCase } from "../../UseCase";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";

export class SubscribeToWebhook extends TransactionalUseCase<
  CreateWebhookSubscription,
  void,
  ApiConsumer
> {
  protected inputSchema = createWebhookSubscriptionSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly uuidGenerator: UuidGenerator,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    webhookSubscription: CreateWebhookSubscription,
    uow: UnitOfWork,
    payload: ApiConsumer,
  ) {
    if (!payload) throw errors.user.noJwtProvided();

    const rightName = eventToRightName(webhookSubscription.subscribedEvent);

    const newSubscription: WebhookSubscription = {
      ...webhookSubscription,
      createdAt: this.timeGateway.now().toISOString(),
      id: this.uuidGenerator.new(),
    };

    await uow.apiConsumerRepository.save({
      ...payload,
      rights: {
        ...payload.rights,
        [rightName]: {
          ...payload.rights[rightName],
          subscriptions: [
            ...payload.rights[rightName].subscriptions,
            newSubscription,
          ],
        },
      },
    });
  }
}
