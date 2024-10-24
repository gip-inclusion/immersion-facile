import {
  AgencyId,
  Email,
  GetUsersFilters,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  User,
  UserId,
  WithAgencyRole,
  WithEstablishments,
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

export type UserOnRepository = User &
  WithIsBackOfficeAdmin &
  WithEstablishments;

export interface UserRepository {
  delete(id: UserId): Promise<void>;
  save(user: UserOnRepository, provider: OAuthGatewayProvider): Promise<void>;

  //TODO pourquoi cette méthode alors qu'on a un save?
  updateEmail(userId: string, email: string): Promise<void>;

  getById(
    userId: UserId,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
  getByIds(
    userIds: UserId[],
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]>;

  getUsers(filters: GetUsersFilters): Promise<UserOnRepository[]>;
  findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
  findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
}
