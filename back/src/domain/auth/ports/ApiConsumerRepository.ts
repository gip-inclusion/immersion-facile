import { ApiConsumer, ApiConsumerId } from "shared";

export interface ApiConsumerRepository {
  getById(id: ApiConsumerId): Promise<ApiConsumer | undefined>;
}
