import { AgencyId, AgencyRole, InclusionConnectedUser, UserId } from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../../config/pg/kysely/kyselyUtils";
import {
  InclusionConnectedFilters,
  InclusionConnectedUserRepository,
} from "../../../dashboard/port/InclusionConnectedUserRepository";

export class PgInclusionConnectedUserRepository
  implements InclusionConnectedUserRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getById(
    userId: string,
  ): Promise<InclusionConnectedUser | undefined> {
    const icUsers = await this.#getInclusionConnectedUsers({ userId });
    return icUsers[0];
  }

  public async getWithFilter({
    agencyRole,
    agencyId,
  }: InclusionConnectedFilters): Promise<InclusionConnectedUser[]> {
    return this.#getInclusionConnectedUsers({ agencyRole, agencyId });
  }

  public async update(user: InclusionConnectedUser): Promise<void> {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `
        DELETE FROM users__agencies WHERE user_id = $1
        `,
      [user.id],
    );
    if (user.agencyRights.length > 0)
      await this.transaction
        .insertInto("users__agencies")
        .values(
          user.agencyRights.map(({ agency, role }) => ({
            user_id: user.id,
            agency_id: agency.id,
            role,
          })),
        )
        .execute();
  }

  async #getInclusionConnectedUsers(filters: {
    userId?: UserId;
    agencyRole?: AgencyRole;
    agencyId?: AgencyId;
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
          'coveredDepartments', agencies.covered_departments,
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
          'refersToAgencyId', agencies.refers_to_agency_id,
          'rejectionJustification', agencies.rejection_justification,
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

    const response = await executeKyselyRawSqlQuery(
      this.transaction,
      `
      SELECT JSON_BUILD_OBJECT(
        'id', users.id,
        'email', users.email,
        'firstName', users.first_name,
        'lastName', users.last_name,
        'createdAt', users.created_at,
        'agencyRights', 
            CASE 
              WHEN ${agencyRightsJsonAgg} = '[null]' THEN '[]' 
              ELSE ${agencyRightsJsonAgg} 
            END ,
         'externalId', users.external_id
        ) as inclusion_user
      FROM users
      LEFT JOIN users__agencies ON users.id = users__agencies.user_id
      LEFT JOIN agencies ON users__agencies.agency_id = agencies.id
      ${whereClause.statement}
      GROUP BY users.id;
    `,
      whereClause.values,
    );

    if (response.rows.length === 0) return [];
    return response.rows.map(
      (row): InclusionConnectedUser => ({
        ...row.inclusion_user,
        createdAt: new Date(row.inclusion_user.createdAt).toISOString(),
        dashboards: {
          agencies: {},
          establishments: {},
        },
      }),
    );
  }
}

type Filters = {
  userId?: UserId;
  agencyRole?: AgencyRole;
  agencyId?: AgencyId;
};

type WhereClause = {
  statement: string;
  values: string[];
};

const getWhereClause = (filters: Filters): WhereClause => {
  if (!filters.userId && !filters.agencyRole && !filters.agencyId) {
    return { statement: "WHERE users.id IS NULL", values: [] };
  }

  let searchClause = "WHERE";
  let searchParams: string[] = [];

  if (filters.userId) {
    searchClause = `${searchClause} users.id = $1`;
    searchParams = [...searchParams, filters.userId];
  }

  if (filters.agencyRole) {
    searchClause = `${searchClause} ${searchParams.length > 0 ? "AND" : ""} users.id IN (
        SELECT user_id FROM users__agencies WHERE users__agencies.role = $${
          searchParams.length + 1
        }
        )`;
    searchParams = [...searchParams, filters.agencyRole];
  }

  if (filters.agencyId) {
    searchClause = `${searchClause} ${
      searchParams.length > 0 ? "AND" : ""
    } users__agencies.agency_id = $${searchParams.length + 1}`;
    searchParams = [...searchParams, filters.agencyId];
  }

  return {
    statement: searchClause,
    values: searchParams,
  };
};
