import { sql } from "kysely";
import { Email, User, UserId } from "shared";
import { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { UserRepository } from "../port/UserRepositiory";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  external_id: string | null;
  created_at: string;
};

export class PgUserRepository implements UserRepository {
  constructor(private transaction: KyselyDb) {}

  public async findByExternalId(externalId: string): Promise<User | undefined> {
    const response = await this.transaction
      .selectFrom("users")
      .selectAll()
      .where("external_id", "=", externalId)
      .executeTakeFirst();
    return toAuthenticatedUser(response);
  }

  public async findByEmail(email: Email): Promise<User | undefined> {
    const response = await this.transaction
      .selectFrom("users")
      .selectAll()
      .where("email", "ilike", email)
      .executeTakeFirst();
    return toAuthenticatedUser(response);
  }

  public async save(user: User): Promise<void> {
    const { id, email, firstName, lastName, externalId, createdAt } = user;

    const existingUser = await this.#findById(id);

    if (!existingUser) {
      await this.transaction
        .insertInto("users")
        .values({
          id,
          email,
          first_name: firstName,
          last_name: lastName,
          external_id: externalId,
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
        external_id: externalId,
        updated_at: sql`now()`,
      })
      .where("id", "=", id)
      .execute();
    return;
  }

  async #findById(userId: UserId) {
    const response = await this.transaction
      .selectFrom("users")
      .selectAll()
      .where("id", "=", userId)
      .executeTakeFirst();
    return toAuthenticatedUser(response);
  }
}

const toAuthenticatedUser = (
  raw?: PersistenceAuthenticatedUser,
): User | undefined =>
  raw && {
    id: raw.id,
    email: raw.email,
    firstName: raw.first_name,
    lastName: raw.last_name,
    externalId: raw.external_id,
    createdAt: new Date(raw.created_at).toISOString(),
  };
