import { sql } from "kysely";
import { map, uniqBy } from "ramda";
import {
  AgencyId,
  AgencyRight,
  AgencyRole,
  Email,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  User,
  UserId,
  activeAgencyStatuses,
  errors,
  pipeWithValue,
} from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../../../config/pg/kysely/kyselyUtils";
import {
  InclusionConnectedFilters,
  UserRepository,
} from "../port/UserRepository";
import {
  addEmailsToAgency,
  getUsersWithAgencyRole,
} from "./agencyUsers.helpers";

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

  public async findByExternalId(
    externalId: string,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined> {
    const response = await this.transaction
      .selectFrom("users")
      .select([
        "id",
        "first_name",
        "last_name",
        "email",
        "created_at",
        provider === "InclusionConnect"
          ? "inclusion_connect_sub as external_id"
          : "pro_connect_sub as external_id",
      ])
      .where(
        provider === "InclusionConnect"
          ? "inclusion_connect_sub"
          : "pro_connect_sub",
        "=",
        externalId,
      )
      .executeTakeFirst();
    return toAuthenticatedUser(response);
  }

  public async findByEmail(
    email: Email,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined> {
    const response = await this.#getUserQueryBuilder(provider)
      .where("email", "ilike", email)
      .executeTakeFirst();
    return toAuthenticatedUser(response);
  }

  #getUserQueryBuilder(provider: OAuthGatewayProvider) {
    return this.transaction
      .selectFrom("users")
      .select([
        "id",
        "first_name",
        "last_name",
        "email",
        "created_at",
        provider === "InclusionConnect"
          ? "inclusion_connect_sub as external_id"
          : "pro_connect_sub as external_id",
      ]);
  }

  public async save(user: User, provider: OAuthGatewayProvider): Promise<void> {
    const { id, email, firstName, lastName, externalId, createdAt } = user;

    const existingUser = await this.#findById(id, provider);

    if (!existingUser) {
      await this.transaction
        .insertInto("users")
        .values({
          id,
          email,
          first_name: firstName,
          last_name: lastName,
          [provider === "InclusionConnect"
            ? "inclusion_connect_sub"
            : "pro_connect_sub"]: externalId,
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
        [provider === "InclusionConnect"
          ? "inclusion_connect_sub"
          : "pro_connect_sub"]: externalId,
        updated_at: sql`now()`,
      })
      .where("id", "=", id)
      .execute();
    return;
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

  async #findById(
    userId: UserId,
    provider: OAuthGatewayProvider,
  ): Promise<User | undefined> {
    const response = await this.#getUserQueryBuilder(provider)
      .where("id", "=", userId)
      .executeTakeFirst();
    return toAuthenticatedUser(response);
  }

  public async getById(
    userId: string,
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser | undefined> {
    const icUsers = await this.#getInclusionConnectedUsers(
      { userId },
      provider,
    );
    return icUsers[0];
  }

  public async getIcUsersWithFilter(
    { agencyRole, agencyId, email }: InclusionConnectedFilters,
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser[]> {
    return this.#getInclusionConnectedUsers(
      { agencyRole, agencyId, email },
      provider,
    );
  }

  public async updateAgencyRights({
    userId,
    agencyRights,
  }: {
    userId: UserId;
    agencyRights: AgencyRight[];
  }): Promise<void> {
    await this.transaction
      .deleteFrom("users__agencies")
      .where("user_id", "=", userId)
      .executeTakeFirstOrThrow();

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

  async #getInclusionConnectedUsers(
    filters: {
      userId?: UserId;
      agencyRole?: AgencyRole;
      agencyId?: AgencyId;
      email?: Email;
    },
    provider: OAuthGatewayProvider,
  ): Promise<InclusionConnectedUser[]> {
    const buildAgencyRight = `JSON_BUILD_OBJECT(
       'roles', users__agencies.roles,
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
    const inActiveAgencyStatuses = `('${activeAgencyStatuses.join("','")}')`;
    const agencyRightsJsonAgg = `JSONB_AGG(${buildAgencyRight}) FILTER (WHERE agencies.id IS NOT NULL AND agencies.status in ${inActiveAgencyStatuses} )`;

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
        'externalId', users.${
          provider === "InclusionConnect"
            ? "inclusion_connect_sub"
            : "pro_connect_sub"
        },
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
        inclusion_user: {
          isBackofficeAdmin,
          createdAt,
          agencyRights,
          establishments,
          ...rest
        },
      }): InclusionConnectedUser => ({
        ...rest,
        agencyRights: pipeWithValue(
          agencyRights as AgencyRight[],
          uniqBy(({ agency }) => agency.id),
          map(
            (agencyRight: AgencyRight): AgencyRight => ({
              ...agencyRight,
              agency: addEmailsToAgency(usersWithAgencyRole)(
                agencyRight.agency,
              ),
            }),
          ),
        ),
        establishments: uniqBy(({ siret }) => siret, establishments),
        createdAt: new Date(createdAt).toISOString(),
        dashboards: {
          agencies: {},
          establishments: {},
        },
        ...(isBackofficeAdmin ? { isBackofficeAdmin: true } : {}),
      }),
    );
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

type Filters = {
  userId?: UserId;
  agencyRole?: AgencyRole;
  agencyId?: AgencyId;
  email?: Email;
};

type WhereClause = {
  statement: string;
  values: string[];
};

const getWhereClause = (filters: Filters): WhereClause => {
  if (
    !filters.userId &&
    !filters.agencyRole &&
    !filters.agencyId &&
    !filters.email
  ) {
    return { statement: "WHERE users.id IS NULL", values: [] };
  }

  let searchClause = "WHERE";
  let searchParams: string[] = [];

  if (filters.userId) {
    searchClause = `${searchClause} users.id = $1`;
    searchParams = [...searchParams, filters.userId];
  }

  if (filters.email) {
    searchClause = `${searchClause} users.email = $${searchParams.length + 1}`;
    searchParams = [...searchParams, filters.email];
  }

  if (filters.agencyRole) {
    searchClause = `${searchClause} ${searchParams.length > 0 ? "AND" : ""} users.id IN (
          SELECT user_id FROM users__agencies WHERE users__agencies.roles @> $${
            searchParams.length + 1
          })`;
    searchParams = [...searchParams, JSON.stringify([filters.agencyRole])];
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
