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

export type UserOnRepository = User & WithIsBackOfficeAdmin;

export interface UserRepository {
  save(user: UserOnRepository, provider: OAuthGatewayProvider): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>; //TODO pourquoi cette méthode alors qu'on a un save?
  delete(id: UserId): Promise<void>;

  getById(
    userId: UserId,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
  getByIds(
    userIds: UserId[],
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]>;

  getUsers(
    filters: GetUsersFilters,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]>;
  findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
  findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
}
