import { AgencyId, InclusionConnectedUser, WithAgencyRole } from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
};

export interface InclusionConnectedUserRepository {
  getWithFilter(
    filter: InclusionConnectedFilters,
  ): Promise<InclusionConnectedUser[]>;
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  update(user: InclusionConnectedUser): Promise<void>;
}
