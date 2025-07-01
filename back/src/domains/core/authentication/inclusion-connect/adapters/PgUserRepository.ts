import { type SqlBool, sql } from "kysely";
import {
  type Email,
  errors,
  type GetUsersFilters,
  isTruthy,
  type SiretDto,
  type User,
  type UserId,
  type UserWithAdminRights,
} from "shared";
import type { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import type { UserRepository } from "../port/UserRepository";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  external_id: string | null;
  siret: SiretDto | null;
  created_at: string;
  isBackofficeAdmin: SqlBool;
};

export class PgUserRepository implements UserRepository {
  constructor(private transaction: KyselyDb) {}

  //For testing purpose
  public async getAllUsers(): Promise<UserWithAdminRights[]> {
    const allUsers = await this.#getUserQueryBuilder().execute();
    return allUsers
      .map((userInDb) => this.#toAuthenticatedUser(userInDb))
      .filter(isTruthy);
  }

  public async delete(userId: UserId): Promise<void> {
    const response = await this.transaction
      .deleteFrom("users")
      .where("id", "=", userId)
      .returning("id")
      .executeTakeFirst();

    if (!response)
      throw errors.user.notFound({
        userId,
      });
  }

  public async save(user: UserWithAdminRights): Promise<void> {
    const { id, email, firstName, lastName, createdAt, proConnect } = user;

    const existingUser = await this.#findById(id);

    if (!existingUser) {
      await this.transaction
        .insertInto("users")
        .values({
          id,
          email,
          first_name: firstName,
          last_name: lastName,
          pro_connect_sub: proConnect?.externalId,
          pro_connect_siret: proConnect?.siret,
          created_at: createdAt,
        })
        .execute();
      return;
    }

    if (
      existingUser.firstName === firstName &&
      existingUser.lastName === lastName &&
      existingUser.email === email &&
      existingUser.proConnect?.externalId === proConnect?.externalId &&
      existingUser.proConnect?.siret === proConnect?.siret
    )
      return;

    await this.transaction
      .updateTable("users")
      .set({
        first_name: firstName,
        last_name: lastName,
        email,
        pro_connect_sub: proConnect?.externalId,
        pro_connect_siret: proConnect?.siret,
        updated_at: sql`now()`,
      })
      .where("id", "=", id)
      .execute();
    return;
  }

  public async updateEmail(userId: string, email: string): Promise<void> {
    await this.transaction
      .updateTable("users")
      .set({
        email,
        updated_at: sql`now()`,
      })
      .where("id", "=", userId)
      .execute();
  }

  public async getById(
    userId: UserId,
  ): Promise<UserWithAdminRights | undefined> {
    const user = await this.#getUserQueryBuilder()
      .where("id", "=", userId)
      .executeTakeFirst();

    return this.#toAuthenticatedUser(user);
  }

  async getByIds(userIds: UserId[]): Promise<UserWithAdminRights[]> {
    if (!userIds.length) return [];
    const usersInDb = await this.#getUserQueryBuilder()
      .where("id", "in", userIds)
      .execute();
    const users = usersInDb
      .map((userInDb) => this.#toAuthenticatedUser(userInDb))
      .filter(isTruthy);
    const missingUserIds = userIds.filter(
      (userId) => !users.some(({ id }) => id === userId),
    );
    if (missingUserIds.length)
      throw errors.users.notFound({ userIds: missingUserIds });
    return users;
  }

  public async getUsers(
    filters: GetUsersFilters,
  ): Promise<UserWithAdminRights[]> {
    if (filters.emailContains === "") return [];
    const usersInDb = await this.#getUserQueryBuilder()
      .where("users.email", "like", `%${filters.emailContains.toLowerCase()}%`)
      .execute();
    return usersInDb
      .map((userInDb) => this.#toAuthenticatedUser(userInDb))
      .filter(isTruthy);
  }

  public async findByExternalId(
    externalId: string,
  ): Promise<UserWithAdminRights | undefined> {
    const response = await this.#getUserQueryBuilder()
      .where("pro_connect_sub", "=", externalId)
      .executeTakeFirst();
    return this.#toAuthenticatedUser(response);
  }

  public async findByEmail(email: Email): Promise<User | undefined> {
    const response = await this.#getUserQueryBuilder()
      .where("users.email", "=", email.toLowerCase())
      .executeTakeFirst();
    return this.#toAuthenticatedUser(response);
  }

  async #findById(userId: UserId): Promise<UserWithAdminRights | undefined> {
    const response = await this.#getUserQueryBuilder()
      .where("id", "=", userId)
      .executeTakeFirst();
    return this.#toAuthenticatedUser(response);
  }

  #getUserQueryBuilder() {
    return this.transaction
      .selectFrom("users")
      .leftJoin("users_admins", "users.id", "users_admins.user_id")
      .select([
        "users.id as id",
        "users.email as email",
        "users.first_name as first_name",
        "users.last_name as last_name",
        (qb) =>
          sql<string>`date_to_iso(${qb.ref("users.created_at")})`.as(
            "created_at",
          ),
        "pro_connect_sub as external_id",
        "pro_connect_siret as siret",
        sql<SqlBool>`BOOL_OR(users_admins.user_id IS NOT NULL)`.as(
          "isBackofficeAdmin",
        ),
      ])
      .groupBy("users.id")
      .orderBy("users.email");
  }

  #toAuthenticatedUser(
    raw?: PersistenceAuthenticatedUser,
  ): UserWithAdminRights | undefined {
    return (
      raw && {
        id: raw.id,
        email: raw.email,
        firstName: raw.first_name,
        lastName: raw.last_name,
        proConnect:
          raw.external_id && raw.siret
            ? {
                externalId: raw.external_id,
                siret: raw.siret,
              }
            : null,
        ...(raw.isBackofficeAdmin === true ? { isBackofficeAdmin: true } : {}),
        createdAt: new Date(raw.created_at).toISOString(),
      }
    );
  }
}
