import type {
  AgencyId,
  Email,
  GetUsersFilters,
  InclusionConnectedUser,
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
  save(user: UserOnRepository): Promise<void>;
  updateEmail(userId: string, email: string): Promise<void>; //TODO pourquoi cette méthode alors qu'on a un save?
  delete(id: UserId): Promise<void>;
  getById(userId: UserId): Promise<UserOnRepository | undefined>;
  getByIds(userIds: UserId[]): Promise<UserOnRepository[]>;
  getUsers(filters: GetUsersFilters): Promise<UserOnRepository[]>;
  findByExternalId(externalId: string): Promise<UserOnRepository | undefined>;
  findByEmail(email: Email): Promise<UserOnRepository | undefined>;
}
