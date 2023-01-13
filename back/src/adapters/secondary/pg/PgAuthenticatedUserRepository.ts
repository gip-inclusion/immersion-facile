import { PoolClient } from "pg";
import { AuthenticatedUser } from "../../../domain/generic/OAuth/entities/AuthenticatedUser";
import { AuthenticatedUserRepository } from "../../../domain/generic/OAuth/ports/AuthentitcatedUserRepositiory";

type PersistenceAuthenticatedUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export class PgAuthenticatedUserRepository
  implements AuthenticatedUserRepository
{
  constructor(private client: PoolClient) {}

  public async findByEmail(
    email: string,
  ): Promise<AuthenticatedUser | undefined> {
    const response = await this.client.query(
      `
      SELECT * FROM authenticated_users WHERE email = $1
      `,
      [email],
    );
    return this.toAuthenticatedUser(response.rows[0]);
  }

  public async save(user: AuthenticatedUser): Promise<void> {
    const { id, email, firstName, lastName } = user;
    if (await this.findByEmail(user.email)) {
      await this.client.query(
        `
        UPDATE authenticated_users
        SET first_name=$2, last_name=$3 
        WHERE email=$1
        `,
        [email, firstName, lastName],
      );
    } else {
      await this.client.query(
        `
      INSERT INTO authenticated_users(id, email, first_name, last_name) VALUES ($1, $2, $3, $4 )
      `,
        [id, email, firstName, lastName],
      );
    }
  }

  private toAuthenticatedUser(
    raw?: PersistenceAuthenticatedUser,
  ): AuthenticatedUser | undefined {
    if (!raw) return;
    return {
      id: raw.id,
      email: raw.email,
      firstName: raw.first_name,
      lastName: raw.last_name,
    };
  }
}

// INSERT INTO form_establishments(
//   siret, source, business_name, business_name_customized, business_address, website, additional_information, is_engaged_enterprise, naf, professions, business_contact, fit_for_disabled_workers
// ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
