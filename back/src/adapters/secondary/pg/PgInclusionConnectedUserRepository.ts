import { PoolClient } from "pg";
import { AgencyDto } from "shared";
import {
  AgencyRight,
  InclusionConnectedUser,
} from "../../../domain/dashboard/entities/InclusionConnectedUser";
import { InclusionConnectedUserRepository } from "../../../domain/dashboard/port/InclusionConnectedUserRepository";
import {
  PersistenceAgency,
  persistenceAgencyToAgencyDto,
} from "./PgAgencyRepository";

export class PgInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  constructor(private client: PoolClient) {}

  async getById(userId: string): Promise<InclusionConnectedUser | undefined> {
    const response = await this.client.query(
      `
    SELECT agencies.*, ST_AsGeoJSON(position) AS position, first_name, last_name, email, authenticated_users.id as user_id FROM authenticated_users
    LEFT JOIN users__agencies ON authenticated_users.id = users__agencies.user_id
    LEFT JOIN agencies ON users__agencies.agency_id = agencies.id
    WHERE authenticated_users.id = $1
    `,
      [userId],
    );

    if (response.rows.length === 0) return;
    return toInclusionConnectedUser(response.rows);
  }

  addAgencyToUser(
    _user: InclusionConnectedUser,
    _agencyId: AgencyDto,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

const toInclusionConnectedUser = (
  rows: (PersistenceInclusionConnectedUser & PersistenceAgency)[],
): InclusionConnectedUser | undefined =>
  rows.reduce((acc, row): InclusionConnectedUser => {
    const { user_id, email, first_name, last_name, ...persistenceAgency } = row;
    const agency: AgencyDto | null =
      persistenceAgency.id && persistenceAgencyToAgencyDto(persistenceAgency);

    return {
      ...acc,
      id: acc.id ?? row.user_id,
      email: acc.email ?? row.email,
      firstName: acc.firstName ?? row.first_name,
      lastName: acc.lastName ?? row.last_name,
      agencyRights: [
        ...(acc.agencyRights ?? []),
        ...(agency ? [{ agency, role: "toReview" } satisfies AgencyRight] : []),
      ],
    };
  }, {} as InclusionConnectedUser);

type PersistenceInclusionConnectedUser = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
};
