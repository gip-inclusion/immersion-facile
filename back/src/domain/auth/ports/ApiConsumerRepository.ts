import { ApiConsumer, ApiConsumerId, WebhookSubscription } from "shared";

export interface ApiConsumerRepository {
  save(apiConsumer: ApiConsumer): Promise<void>;
  getById(id: ApiConsumerId): Promise<ApiConsumer | undefined>;
  getAll(): Promise<ApiConsumer[]>;
  addSubscription(params: {
    subscription: WebhookSubscription;
    apiConsumerId: ApiConsumerId;
  }): Promise<void>;
}
