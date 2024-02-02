import {
  ApiConsumer,
  CreateWebhookSubscription,
  WebhookSubscription,
  createWebhookSubscriptionSchema,
  eventToRightName,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";

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
    if (!payload) throw new ForbiddenError("No JWT payload provided");

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
