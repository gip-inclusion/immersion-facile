import {
  AgencyId,
  Email,
  GetUsersFilters,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  User,
  UserId,
  WithAgencyRole,
  WithIsBackOfficeAdmin,
} from "shared";

export type InclusionConnectedFilters = Partial<WithAgencyRole> & {
  agencyId?: AgencyId;
  email?: Email;
  isNotifiedByEmail?: boolean;
};

export type InclusionConnectedUserWithoutRights = Omit<
  InclusionConnectedUser,
  "agencyRights"
>;

export type UserWithAdminRights = User & WithIsBackOfficeAdmin;

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: User, provider: OAuthGatewayProvider): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>;
  findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined>;
  findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined>;

  getById(
    userId: string,
    provider: OAuthGatewayProvider,
  ): Promise<UserWithAdminRights | undefined>;

  getUsers(filters: GetUsersFilters): Promise<User[]>;
}
