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
    userId: UserId,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined>;
  getByIds(
    userIds: UserId[],
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]>;

  getUsers(filters: GetUsersFilters): Promise<User[]>;
}
