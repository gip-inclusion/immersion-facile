import { SqlBool, sql } from "kysely";
import {
  Email,
  GetUsersFilters,
  OAuthGatewayProvider,
  SiretDto,
  User,
  UserId,
  errors,
  isTruthy,
} from "shared";
import { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { UserOnRepository, UserRepository } from "../port/UserRepository";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  external_id: string | null;
  created_at: string;
  isBackofficeAdmin: SqlBool;
  establishments: { siret: string; businessName: string }[];
};

export class PgUserRepository implements UserRepository {
  constructor(private transaction: KyselyDb) {}

  //For testing purpose
  public async getAllUsers(
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]> {
    const allUsers = await this.#getUserQueryBuilder(provider).execute();
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

  public async save(
    user: UserOnRepository,
    provider: OAuthGatewayProvider,
  ): Promise<void> {
    const { id, email, firstName, lastName, externalId, createdAt } = user;
    const providerColumn =
      provider === "inclusionConnect"
        ? "inclusion_connect_sub"
        : "pro_connect_sub";
    const existingUser = await this.#findById(id, provider);

    if (!existingUser) {
      await this.transaction
        .insertInto("users")
        .values({
          id,
          email,
          first_name: firstName,
          last_name: lastName,
          [providerColumn]: externalId,
          created_at: createdAt,
        })
        .execute();
      return;
    }

    if (
      existingUser.firstName === firstName &&
      existingUser.lastName === lastName &&
      existingUser.email === email &&
      existingUser.externalId === externalId
    )
      return;

    await this.transaction
      .updateTable("users")
      .set({
        first_name: firstName,
        last_name: lastName,
        email,
        [providerColumn]: externalId,
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
    userId: string,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined> {
    const user = await this.#getUserQueryBuilder(provider)
      .where("id", "=", userId)
      .executeTakeFirst();

    return this.#toAuthenticatedUser(user);
  }

  async getByIds(
    userIds: UserId[],
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]> {
    if (!userIds.length) return [];
    const usersInDb = await this.#getUserQueryBuilder(provider)
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
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository[]> {
    if (filters.emailContains === "") return [];
    const usersInDb = await this.#getUserQueryBuilder(provider)
      .where("users.email", "ilike", `%${filters.emailContains}%`)
      .execute();
    const users = usersInDb
      .map((userInDb) => this.#toAuthenticatedUser(userInDb))
      .filter(isTruthy);
    return users;
  }

  public async findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined> {
    const response = await this.#getUserQueryBuilder(provider)
      .where(
        provider === "inclusionConnect"
          ? "inclusion_connect_sub"
          : "pro_connect_sub",
        "=",
        externalId,
      )
      .executeTakeFirst();
    return this.#toAuthenticatedUser(response);
  }

  public async findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined> {
    const response = await this.#getUserQueryBuilder(provider)
      .where("users.email", "ilike", email)
      .executeTakeFirst();
    return this.#toAuthenticatedUser(response);
  }

  async #findById(
    userId: UserId,
    provider: OAuthGatewayProvider,
  ): Promise<UserOnRepository | undefined> {
    const response = await this.#getUserQueryBuilder(provider)
      .where("id", "=", userId)
      .executeTakeFirst();
    return this.#toAuthenticatedUser(response);
  }

  #getUserQueryBuilder(provider: OAuthGatewayProvider) {
    // `establishments`, COALESCE(JSONB_AGG(
    //     JSON_BUILD_OBJECT(
    //       'siret', establishments.siret,
    //       'businessName', COALESCE(NULLIF(establishments.customized_name, ''), establishments.name)
    //     )
    //     ORDER BY establishments.siret
    // ) FILTER (WHERE establishments.siret IS NOT NULL), '[]'),
    // LEFT JOIN establishments_contacts ec ON users.email = ec.email
    // LEFT JOIN establishments ON ec.siret = establishments.siret

    return this.transaction
      .selectFrom("users")
      .leftJoin(
        "establishments_contacts",
        "users.email",
        "establishments_contacts.email",
      )
      .leftJoin(
        "establishments",
        "establishments_contacts.siret",
        "establishments.siret",
      )
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
        (qb) =>
          qb
            .ref(
              provider === "proConnect"
                ? "pro_connect_sub"
                : "inclusion_connect_sub",
            )
            .as("external_id"),
        sql<SqlBool>`BOOL_OR(users_admins.user_id IS NOT NULL)`.as(
          "isBackofficeAdmin",
        ),
        sql<{ siret: SiretDto; businessName: string }[]>`COALESCE(
          JSONB_AGG(
            JSON_BUILD_OBJECT(
              'siret', establishments.siret,
              'businessName', COALESCE(NULLIF(establishments.customized_name, ''), establishments.name)
            )
            ORDER BY establishments.siret
          ) FILTER (WHERE establishments.siret IS NOT NULL)
          , '[]'
        )`.as("establishments"),
      ])
      .groupBy("users.id")
      .orderBy("users.email");
  }

  #toAuthenticatedUser(
    raw?: PersistenceAuthenticatedUser,
  ): UserOnRepository | undefined {
    return (
      raw && {
        id: raw.id,
        email: raw.email,
        firstName: raw.first_name,
        lastName: raw.last_name,
        externalId: raw.external_id,
        ...(raw.isBackofficeAdmin === true ? { isBackofficeAdmin: true } : {}),
        ...(raw.establishments.length
          ? { establishments: raw.establishments }
          : {}),
        createdAt: new Date(raw.created_at).toISOString(),
      }
    );
  }
}
