import { ApiConsumerId, ApiConsumer } from "../valueObjects/ApiConsumer";

// prettier-ignore
export type GetApiConsumerById = (id: ApiConsumerId) => Promise<ApiConsumer | undefined>;
