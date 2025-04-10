import type {
  AgencyId,
  Email,
  GetUsersFilters,
  InclusionConnectedUser,
  UserId,
  UserWithAdminRights,
  WithAgencyRole,
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

export interface UserRepository {
  save(user: UserWithAdminRights): Promise<void>;
  updateEmail(userId: UserId, email: Email): Promise<void>; //TODO pourquoi cette méthode alors qu'on a un save?
  delete(id: UserId): Promise<void>;
  getById(userId: UserId): Promise<UserWithAdminRights | undefined>;
  getByIds(userIds: UserId[]): Promise<UserWithAdminRights[]>;
  getUsers(filters: GetUsersFilters): Promise<UserWithAdminRights[]>;
  findByExternalId(
    externalId: string,
  ): Promise<UserWithAdminRights | undefined>;
  findByEmail(email: Email): Promise<UserWithAdminRights | undefined>;
}
