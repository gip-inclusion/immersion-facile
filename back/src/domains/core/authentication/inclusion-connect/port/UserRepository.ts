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
  save(user: User, mode: OAuthProvider): Promise<void>;
  findByExternalId(
    externalId: string,
    mode: OAuthProvider,
  ): Promise<User | undefined>;
  findByEmail(email: Email, mode: OAuthProvider): Promise<User | undefined>;
  getWithFilter(
    filters: InclusionConnectedFilters,
    mode: OAuthProvider,
  ): Promise<InclusionConnectedUser[]>;
  getById(
    userId: string,
    mode: OAuthProvider,
  ): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
}
