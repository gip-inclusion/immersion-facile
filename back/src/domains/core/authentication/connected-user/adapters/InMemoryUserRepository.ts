import { keys, values } from "ramda";
import {
  type Email,
  errors,
  type GetUsersFilters,
  type UserId,
  type UserWithAdminRights,
  type UserWithNumberOfAgenciesAndEstablishments,
} from "shared";
import type { UserRepository } from "../port/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  #usersById: Record<string, UserWithAdminRights> = {};

  public async findByExternalId(
    externalId: string,
  ): Promise<UserWithAdminRights | undefined> {
    return this.users.find(
      (user) => user.proConnect?.externalId === externalId,
    );
  }

  public async findByEmail(
    email: Email,
  ): Promise<UserWithAdminRights | undefined> {
    return this.users.find((user) => user.email === email);
  }

  public async getByIds(userIds: UserId[]): Promise<UserWithAdminRights[]> {
    const users = this.users.filter((user) => userIds.includes(user.id));

    const missingUserIds = userIds.filter(
      (userId) => !users.some((user) => user.id === userId),
    );

    if (missingUserIds.length > 0)
      throw errors.users.notFound({ userIds: missingUserIds });

    return users;
  }

  public async save(user: UserWithAdminRights): Promise<void> {
    this.#usersById[user.id] = user;
    if (
      values(this.#usersById).filter(({ email }) => email === user.email)
        .length > 1
    )
      throw errors.user.conflictByEmail({ userEmail: user.email });

    const externalId = user.proConnect?.externalId;
    if (
      externalId &&
      values(this.#usersById).filter(
        ({ proConnect }) => proConnect?.externalId === externalId,
      ).length > 1
    )
      throw errors.user.conflictByExternalId({ externalId });
  }

  public async delete(id: UserId): Promise<void> {
    const user = this.#usersById[id];
    if (!user) throw errors.user.notFound({ userId: id });

    delete this.#usersById[id];
  }

  // for test purpose
  public get users(): UserWithAdminRights[] {
    return values(this.#usersById);
  }

  public set users(users: UserWithAdminRights[]) {
    this.#usersById = users.reduce<Record<UserId, UserWithAdminRights>>(
      (acc, user) => {
        if (keys(acc).includes(user.id))
          throw errors.user.conflictById({ userId: user.id });
        return {
          ...acc,
          [user.id]: user,
        };
      },
      {},
    );
  }

  public async getById(
    userId: string,
  ): Promise<UserWithAdminRights | undefined> {
    return this.users.find((user) => user.id === userId);
  }

  public async getUsers(
    filters: GetUsersFilters,
  ): Promise<UserWithNumberOfAgenciesAndEstablishments[]> {
    return this.users
      .filter((user) =>
        user.email.toLowerCase().includes(filters.emailContains.toLowerCase()),
      )
      .map((u) => ({
        ...u,
        numberOfAgencies: 404, // no need to implement this
        numberOfEstablishments: 404, // no need to implement this
      }));
  }

  public async updateEmail(userId: UserId, email: string): Promise<void> {
    this.#usersById[userId].email = email;
  }

  public async getInactiveUsers(
    since: Date,
    _options?: { excludeWarnedSince?: Date },
  ): Promise<UserWithAdminRights[]> {
    return this.users.filter(
      (user) => !user.lastLoginAt || new Date(user.lastLoginAt) < since,
    );
  }
}
