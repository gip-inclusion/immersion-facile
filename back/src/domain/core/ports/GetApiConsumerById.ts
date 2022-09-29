import { ApiConsumer, ApiConsumerId } from "shared";

// prettier-ignore
export type GetApiConsumerById = (id: ApiConsumerId) => Promise<ApiConsumer | undefined>;
