import { ApiConsumer, ApiConsumerId } from "shared";

export type GetApiConsumerById = (
  id: ApiConsumerId,
) => Promise<ApiConsumer | undefined>;

export interface ApiConsumerRepository {
  save(apiConsumer: ApiConsumer): Promise<void>;
  getAll(): Promise<ApiConsumer[]>;
  getById: GetApiConsumerById;
}
