import {
  AgencyId,
  AgencyRight,
  Email,
  InclusionConnectedUser,
  User,
  UserId,
  WithAgencyRole,
} from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
};

export interface UserRepository {
  save(user: User): Promise<void>;
  findByExternalId(externalId: string): Promise<User | undefined>;
  findByEmail(email: Email): Promise<User | undefined>;
  getWithFilter(
    filters: InclusionConnectedFilters,
  ): Promise<InclusionConnectedUser[]>;
  getById(userId: string): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
}
