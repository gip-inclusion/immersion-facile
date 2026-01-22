import {
  type ApiConsumer,
  type CreateWebhookSubscription,
  createWebhookSubscriptionSchema,
  errors,
  eventToRightName,
  type WebhookSubscription,
} from "shared";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";

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

    const apiConsumerPhoneId =
      await uow.phoneNumberRepository.getIdByPhoneNumber(
        payload.contact.phone,
        this.timeGateway.now(),
      );

    await uow.apiConsumerRepository.save({
      apiConsumer: {
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
      },
      phoneId: apiConsumerPhoneId,
    });
  }
}
