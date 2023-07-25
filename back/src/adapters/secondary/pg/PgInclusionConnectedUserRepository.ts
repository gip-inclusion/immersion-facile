import { PoolClient } from "pg";
import format from "pg-format";
import {
  AgencyRole,
  AuthenticatedUserId,
  InclusionConnectedUser,
  WithAgencyRole,
} from "shared";
import { InclusionConnectedUserRepository } from "../../../domain/dashboard/port/InclusionConnectedUserRepository";

export class PgInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  constructor(private client: PoolClient) {}

  public async getWithFilter({
    agencyRole,
  }: Partial<WithAgencyRole>): Promise<InclusionConnectedUser[]> {
    return this.getInclusionConnectedUsers({ agencyRole });
  }

  async getById(userId: string): Promise<InclusionConnectedUser | undefined> {
    const icUsers = await this.getInclusionConnectedUsers({ userId });
    return icUsers[0];
  }

  async update(user: InclusionConnectedUser): Promise<void> {
    await this.client.query(
      `
        DELETE FROM users__agencies WHERE user_id = $1
        `,
      [user.id],
    );
    await this.client.query(
      format(
        `INSERT INTO users__agencies (user_id, agency_id, role) VALUES %L`,
        user.agencyRights.map(({ agency, role }) => [user.id, agency.id, role]),
      ),
    );
  }

  async isUserAllowedToAccessConvention(
    userId: string,
    conventionId: string,
  ): Promise<boolean> {
    const response = await this.client.query(
      `
          WITH agency_id_in_convention AS (
              SELECT agency_id
              FROM conventions
              WHERE id = $2
          )
          SELECT role
          FROM users__agencies
          WHERE user_id = $1 AND agency_id IN (SELECT agency_id FROM agency_id_in_convention)
      `,
      [userId, conventionId],
    );
    const withRole: { role: AgencyRole } = response.rows[0];
    const noResult = !withRole;

    return !(noResult || withRole.role === "toReview");
  }

  private async getInclusionConnectedUsers(filters: {
    userId?: AuthenticatedUserId;
    agencyRole?: AgencyRole;
  }): Promise<InclusionConnectedUser[]> {
    const buildAgencyRight = `JSON_BUILD_OBJECT(
       'role', users__agencies.role,
       'agency', JSON_BUILD_OBJECT(
          'id', agencies.id,
          'address', JSON_BUILD_OBJECT(
            'streetNumberAndAddress', agencies.street_number_and_address,
            'postcode', agencies.post_code,
            'departmentCode', agencies.department_code,
            'city', agencies.city
          ),
          'adminEmails', agencies.admin_emails,
          'agencySiret', agencies.agency_siret,
          'codeSafir', agencies.code_safir,
          'counsellorEmails', agencies.counsellor_emails,
          'kind', agencies.kind,
          'logoUrl', agencies.logo_url,
          'name', agencies.name,
          'position',  JSON_BUILD_OBJECT(
            'lat', ST_Y(ST_AsText(agencies.position)::geometry),
            'lon', ST_X(ST_AsText(agencies.position)::geometry)
          ),
          'questionnaireUrl', agencies.questionnaire_url,
          'signature', agencies.email_signature,
          'status', agencies.status,
          'validatorEmails', agencies.validator_emails
        )
      )`;

    const agencyRightsJsonAgg = `JSONB_AGG(
      CASE
        WHEN agencies.id IS NOT NULL THEN ${buildAgencyRight}
        ELSE NULL
      END
    )`;

    const whereClause = getWhereClause(filters);

    const response = await this.client.query(
      `
      SELECT JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
        'id', authenticated_users.id,
        'email', authenticated_users.email,
        'firstName', authenticated_users.first_name,
        'lastName', authenticated_users.last_name,
        'agencyRights', 
            CASE 
              WHEN ${agencyRightsJsonAgg} = '[null]' THEN '[]' 
              ELSE ${agencyRightsJsonAgg} 
            END 
        )) as inclusion_user
      FROM authenticated_users
      LEFT JOIN users__agencies ON authenticated_users.id = users__agencies.user_id
      LEFT JOIN agencies ON users__agencies.agency_id = agencies.id
      ${whereClause.statement}
      GROUP BY authenticated_users.id;
    `,
      whereClause.values,
    );

    if (response.rows.length === 0) return [];
    return response.rows.map((row) => row.inclusion_user);
  }
}

type Filters = { userId?: AuthenticatedUserId; agencyRole?: AgencyRole };

type WhereClause = {
  statement: string;
  values: string[];
};

const getWhereClause = (filters: Filters): WhereClause => {
  if (filters.userId)
    return {
      statement: "WHERE authenticated_users.id = $1",
      values: [filters.userId],
    };

  if (filters.agencyRole)
    return {
      statement: `WHERE authenticated_users.id IN (
        SELECT user_id FROM users__agencies WHERE users__agencies.role = $1
        )`,
      values: [filters.agencyRole],
    };

  return { statement: "WHERE authenticated_users.id IS NULL", values: [] };
};
