import {
  AgencyId,
  AgencyRight,
  Email,
  InclusionConnectedUser,
  OAuthProvider,
  User,
  UserId,
  WithAgencyRole,
} from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
  email?: Email;
};

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: User, provider: OAuthProvider): Promise<void>;
  findByExternalId(
    externalId: string,
    provider: OAuthProvider,
  ): Promise<User | undefined>;
  findByEmail(email: Email, provider: OAuthProvider): Promise<User | undefined>;
  getWithFilter(
    filters: InclusionConnectedFilters,
    provider: OAuthProvider,
  ): Promise<InclusionConnectedUser[]>;
  getById(
    userId: string,
    provider: OAuthProvider,
  ): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
}
