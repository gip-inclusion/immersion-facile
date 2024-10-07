import {
  AgencyId,
  AgencyRight,
  Email,
  GetUsersFilters,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  User,
  UserId,
  UserInList,
  WithAgencyRole,
} from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
  email?: Email;
  isNotifiedByEmail?: boolean;
};

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: User, provider: OAuthGatewayProvider): Promise<void>;
  findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  getIcUsersWithFilter(
    filters: InclusionConnectedFilters,
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser[]>;
  getUsers(filters: GetUsersFilters): Promise<UserInList[]>;
  getById(
    userId: string,
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser | undefined>;
  updateAgencyRights(params: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
}
