import { ApiConsumerId, ApiConsumer } from "shared";

export interface ApiConsumerRepository {
  getById(id: ApiConsumerId): Promise<ApiConsumer | undefined>;
}
