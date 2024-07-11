import {
  AgencyId,
  AgencyRight,
  InclusionConnectedUser,
  UserId,
  WithAgencyRole,
} from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
};

export interface InclusionConnectedUserRepository {
  getWithFilter(
    filters: InclusionConnectedFilters,
  ): Promise<InclusionConnectedUser[]>;
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
}
