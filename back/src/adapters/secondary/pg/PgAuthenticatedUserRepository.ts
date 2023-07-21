import { CompiledQuery, Kysely } from "kysely";
import { AuthenticatedUser, AuthenticatedUserId, Email } from "shared";
import { AuthenticatedUserRepository } from "../../../domain/generic/OAuth/ports/AuthenticatedUserRepositiory";
import { ImmersionDatabase } from "./sql/database";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export class PgAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  public async findByEmail(
    email: string,
  ): Promise<AuthenticatedUser | undefined> {
    const query = `
      SELECT * 
      FROM authenticated_users 
      WHERE email = $1
    `;
    const response = await this.transaction.executeQuery<any>(
      CompiledQuery.raw(query, [email]),
    );
    return toAuthenticatedUser(response.rows.at(0));
  }

  private async insert(
    id: AuthenticatedUserId,
    email: Email,
    firstName: string,
    lastName: string,
  ) {
    const query = `
      INSERT INTO authenticated_users (id, email, first_name, last_name) 
      VALUES ($1, $2, $3, $4 )
    `;
    await this.transaction.executeQuery<any>(
      CompiledQuery.raw(query, [id, email, firstName, lastName]),
    );
  }

  public async save({
    email,
    firstName,
    id,
    lastName,
  }: AuthenticatedUser): Promise<void> {
    const existingUser = await this.findByEmail(email);
    if (!existingUser) return this.insert(id, email, firstName, lastName);
    if (
      existingUser.firstName === firstName &&
      existingUser.lastName === lastName
    )
      return;
    return this.update(email, firstName, lastName);
  }

  private async update(email: Email, firstName: string, lastName: string) {
    const query = `
      UPDATE authenticated_users
      SET first_name=$2, last_name=$3, updated_at=now()
      WHERE email=$1
    `;
    await this.transaction.executeQuery<any>(
      CompiledQuery.raw(query, [email, firstName, lastName]),
    );
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
  };
