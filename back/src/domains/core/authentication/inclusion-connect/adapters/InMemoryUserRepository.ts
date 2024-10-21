import { values } from "ramda";
import {
  Email,
  GetUsersFilters,
  OAuthGatewayProvider,
  User,
  UserId,
  UserWithAdminRights,
  errors,
} from "shared";
import { UserOnRepository, UserRepository } from "../port/UserRepository";

export class InMemoryUserRepository implements UserRepository {
  #usersById: Record<string, UserWithAdminRights> = {};

  public async findByExternalId(externalId: string): Promise<User | undefined> {
    return this.users.find((user) => user.externalId === externalId);
  }

  public async findByEmail(email: Email): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  public async getByIds(
    userIds: UserId[],
    _: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]> {
    const users = this.users.filter((user) => userIds.includes(user.id));

    const missingUserIds = userIds.filter(
      (userId) => !users.some((user) => user.id === userId),
    );

    if (missingUserIds.length > 0)
      throw errors.users.notFound({ userIds: missingUserIds });

    return users;
  }

  public async save(user: User): Promise<void> {
    this.#usersById[user.id] = user;
    if (
      values(this.#usersById).filter(({ email }) => email === user.email)
        .length > 1
    )
      throw errors.user.conflictByEmail({ userEmail: user.email });
    if (
      user.externalId &&
      values(this.#usersById).filter(
        ({ externalId }) => externalId === user.externalId,
      ).length > 1
    )
      throw errors.user.conflictByExternalId({ externalId: user.externalId });
  }

  public async delete(id: UserId): Promise<void> {
    const user = this.#usersById[id];
    if (!user) throw errors.user.notFound({ userId: id });

    delete this.#usersById[id];
  }

  // for test purpose
  public get users(): User[] {
    return values(this.#usersById);
  }

  public set users(users: User[]) {
    this.#usersById = users.reduce(
      (acc, user) => ({
        ...acc,
        [user.id]: user,
      }),
      {} as Record<string, User>,
    );
  }

  public async getById(userId: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === userId);
  }

  public async getUsers(filters: GetUsersFilters): Promise<User[]> {
    return this.users.filter((user) =>
      user.email.toLowerCase().includes(filters.emailContains.toLowerCase()),
    );
  }

  public async updateEmail(userId: string, email: string): Promise<void> {
    this.#usersById[userId].email = email;
  }
}
