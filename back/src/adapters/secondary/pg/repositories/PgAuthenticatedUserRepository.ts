import { AuthenticatedUser } from "shared";
import { AuthenticatedUserRepository } from "../../../../domain/generic/OAuth/ports/AuthenticatedUserRepositiory";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  external_id: string;
};

export class PgAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  constructor(private transaction: KyselyDb) {}

  public async findByEmail(
    email: string,
  ): Promise<AuthenticatedUser | undefined> {
    const response =
      await executeKyselyRawSqlQuery<PersistenceAuthenticatedUser>(
        this.transaction,
        `
      SELECT * FROM authenticated_users WHERE email = $1
      `,
        [email],
      );
    return toAuthenticatedUser(response.rows[0]);
  }

  public async findByExternalId(
    externalId: string,
  ): Promise<AuthenticatedUser | undefined> {
    const response = await this.transaction
      .selectFrom("authenticated_users")
      .selectAll()
      .where("external_id", "=", externalId)
      .execute();
    return toAuthenticatedUser(response[0]);
  }

  public async save(user: AuthenticatedUser): Promise<void> {
    const { id, email, firstName, lastName, externalId } = user;
    const existingUser = await this.findByExternalId(externalId);
    if (existingUser) {
      if (
        existingUser.firstName === firstName &&
        existingUser.lastName === lastName &&
        existingUser.email === email
      )
        return;

      await executeKyselyRawSqlQuery(
        this.transaction,
        `
        UPDATE authenticated_users
        SET first_name=$2, last_name=$3, updated_at=now(), email=$1
        WHERE external_id=$4
        `,
        [email, firstName, lastName, externalId],
      );
    } else {
      await executeKyselyRawSqlQuery(
        this.transaction,
        `
      INSERT INTO authenticated_users(id, email, first_name, last_name, external_id) VALUES ($1, $2, $3, $4, $5)
      `,
        [id, email, firstName, lastName, externalId],
      );
    }
  }
}

const toAuthenticatedUser = (
  raw?: PersistenceAuthenticatedUser,
): AuthenticatedUser | undefined =>
  raw && {
    id: raw.id,
    email: raw.email,
    firstName: raw.first_name,
    lastName: raw.last_name,
    externalId: raw.external_id,
  };
