import { sql } from "kysely";
import { User } from "shared";
import { KyselyDb } from "../../../../../config/pg/kysely/kyselyUtils";
import { UserRepository } from "../port/UserRepositiory";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  external_id: string;
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

  public async save(user: User): Promise<void> {
    const { id, email, firstName, lastName, externalId } = user;
    const existingUser = await this.findByExternalId(externalId);

    if (!existingUser) {
      await this.transaction
        .insertInto("users")
        .values({
          id,
          email,
          first_name: firstName,
          last_name: lastName,
          external_id: externalId,
        })
        .execute();
      return;
    }

    if (
      existingUser.firstName === firstName &&
      existingUser.lastName === lastName &&
      existingUser.email === email
    )
      return;

    await this.transaction
      .updateTable("users")
      .set({
        first_name: firstName,
        last_name: lastName,
        email,
        updated_at: sql`now()`,
      })
      .where("external_id", "=", externalId)
      .execute();
    return;
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
  };