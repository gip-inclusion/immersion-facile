import { ApiConsumer, ApiConsumerId } from "shared";

export interface ApiConsumerRepository {
  save(apiConsumer: ApiConsumer): Promise<void>;
  getById(id: ApiConsumerId): Promise<ApiConsumer | undefined>;
}
