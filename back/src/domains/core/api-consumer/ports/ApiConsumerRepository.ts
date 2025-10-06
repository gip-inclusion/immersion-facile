import type { AgencyId, AgencyKind, ApiConsumer, ApiConsumerId } from "shared";

export type GetApiConsumerById = (
  id: ApiConsumerId,
) => Promise<ApiConsumer | undefined>;

export type GetApiConsumerFilters = {
  agencyIds?: AgencyId[];
  agencyKinds?: AgencyKind[];
};

export interface ApiConsumerRepository {
  save(apiConsumer: ApiConsumer): Promise<void>;
  getAll(): Promise<ApiConsumer[]>;
  getById: GetApiConsumerById;
  getByFilters(filters: GetApiConsumerFilters): Promise<ApiConsumer[]>;
}
