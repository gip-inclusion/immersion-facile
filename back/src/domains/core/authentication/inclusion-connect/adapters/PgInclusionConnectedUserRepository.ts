import {
  AgencyId,
  AgencyRight,
  AgencyRole,
  InclusionConnectedUser,
  UserId,
} from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../../config/pg/kysely/kyselyUtils";
import {
  InclusionConnectedFilters,
  InclusionConnectedUserRepository,
} from "../../../dashboard/port/InclusionConnectedUserRepository";
import {
  addEmailsToAgency,
  getUsersWithAgencyRole,
} from "./agencyUsers.helpers";

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

  public async updateAgencyRights({
    userId,
    agencyRights,
  }: { userId: UserId; agencyRights: AgencyRight[] }): Promise<void> {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `
        DELETE FROM users__agencies WHERE user_id = $1
        `,
      [userId],
    );

    if (agencyRights.length > 0)
      await this.transaction
        .insertInto("users__agencies")
        .values(
          agencyRights.map(({ agency, roles, isNotifiedByEmail }) => ({
            user_id: userId,
            agency_id: agency.id,
            roles: JSON.stringify(roles),
            is_notified_by_email: isNotifiedByEmail,
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
       'isNotifiedByEmail', users__agencies.is_notified_by_email,
       'agency', JSON_BUILD_OBJECT(
          'id', agencies.id,
          'address', JSON_BUILD_OBJECT(
            'streetNumberAndAddress', agencies.street_number_and_address,
            'postcode', agencies.post_code,
            'departmentCode', agencies.department_code,
            'city', agencies.city
          ),
          'coveredDepartments', agencies.covered_departments,
          'agencySiret', agencies.agency_siret,
          'codeSafir', agencies.code_safir,
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
          'status', agencies.status
        )
      )`;

    const agencyRightsJsonAgg = `JSONB_AGG(${buildAgencyRight}) FILTER (WHERE agencies.id IS NOT NULL)`;

    const establishmentsJsonAgg = `JSONB_AGG(
      JSON_BUILD_OBJECT(
          'siret', establishments.siret,
          'businessName', COALESCE(NULLIF(establishments.customized_name, ''), establishments.name)
        )
        ORDER BY establishments.siret
    ) FILTER (WHERE establishments.siret IS NOT NULL)`;

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
        'externalId', users.external_id,
        'agencyRights', COALESCE(${agencyRightsJsonAgg}, '[]'),
        'establishments', COALESCE(${establishmentsJsonAgg}, '[]'),
        'isBackofficeAdmin', BOOL_OR(users_admins.user_id IS NOT NULL)
      ) as inclusion_user
      FROM users
      LEFT JOIN users__agencies ON users.id = users__agencies.user_id
      LEFT JOIN users_admins ON users.id = users_admins.user_id
      LEFT JOIN agencies ON users__agencies.agency_id = agencies.id
      LEFT JOIN establishments_contacts ec ON users.email = ec.email
      LEFT JOIN establishments ON ec.siret = establishments.siret
      ${whereClause.statement}
      GROUP BY users.id;
    `,
      whereClause.values,
    );

    if (response.rows.length === 0) return [];

    const agencyIdsToFetch = [
      ...new Set(
        response.rows.reduce<AgencyId[]>((acc, row) => {
          const agencyRights: AgencyRight[] = row.inclusion_user.agencyRights;
          return [...acc, ...agencyRights.map(({ agency }) => agency.id)];
        }, [] as AgencyId[]),
      ),
    ];

    const usersWithAgencyRole = await getUsersWithAgencyRole(this.transaction, {
      agencyIds: agencyIdsToFetch,
      isNotifiedByEmail: true,
    });

    return response.rows.map(
      ({
        inclusion_user: { isBackofficeAdmin, createdAt, agencyRights, ...rest },
      }): InclusionConnectedUser => ({
        ...rest,
        agencyRights: agencyRights.map(
          (agencyRight: AgencyRight): AgencyRight => ({
            ...agencyRight,
            agency: addEmailsToAgency(usersWithAgencyRole)(agencyRight.agency),
          }),
        ),
        createdAt: new Date(createdAt).toISOString(),
        dashboards: {
          agencies: {},
          establishments: {},
        },
        ...(isBackofficeAdmin ? { isBackofficeAdmin: true } : {}),
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
