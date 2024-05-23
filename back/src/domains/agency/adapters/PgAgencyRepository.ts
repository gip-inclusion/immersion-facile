import { InsertObject, sql } from "kysely";
import format from "pg-format";
import { map } from "ramda";
import {
  AbsoluteUrl,
  AddressDto,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyKindFilter,
  AgencyPositionFilter,
  AgencyRole,
  AgencyStatus,
  DepartmentCode,
  Email,
  GeoPositionDto,
  GetAgenciesFilter,
  PartialAgencyDto,
  agencySchema,
  filterNotFalsy,
} from "shared";
import { z } from "zod";
import {
  ConflictError,
  NotFoundError,
  validateAndParseZodSchema,
} from "../../../config/helpers/httpErrors";
import {
  KyselyDb,
  cast,
  executeKyselyRawSqlQuery,
  jsonBuildObject,
} from "../../../config/pg/kysely/kyselyUtils";
import { Database } from "../../../config/pg/kysely/model/database";
import { createLogger } from "../../../utils/logger";
import {
  AgencyWithoutEmails,
  addEmailsToAgency,
  getUsersWithAgencyRole,
  usersAgenciesRolesIncludeCounsellor,
  usersAgenciesRolesIncludeValidator,
} from "../../core/authentication/inclusion-connect/adapters/agencyUsers.helpers";
import {
  AgencyRepository,
  someAgenciesMissingMessage,
} from "../ports/AgencyRepository";

const logger = createLogger(__filename);

const MAX_AGENCIES_RETURNED = 200;
type InsertPgAgency = InsertObject<Database, "agencies">;

type AgencyColumns =
  | "admin_emails"
  | "agency_siret"
  | "city"
  | "code_safir"
  | "counsellor_emails"
  | "department_code"
  | "email_signature"
  | "id"
  | "kind"
  | "logo_url"
  | "name"
  | "position"
  | "post_code"
  | "questionnaire_url"
  | "status"
  | "street_number_and_address"
  | "validator_emails"
  | "refers_to_agency_id"
  | "rejection_justification"
  | "covered_departments";

type PersistenceAgency = Record<AgencyColumns, any>;

const makeAgencyKindFilterSQL = (
  agencyKindFilter?: AgencyKindFilter,
): string | undefined => {
  if (agencyKindFilter === "immersionPeOnly") return "kind = 'pole-emploi'";
  if (agencyKindFilter === "immersionWithoutPe")
    return "kind != 'pole-emploi' AND kind != 'cci'";
  if (agencyKindFilter === "miniStageOnly") return "kind = 'cci'";
  if (agencyKindFilter === "miniStageExcluded") return "kind != 'cci'";
  if (agencyKindFilter === "withoutRefersToAgency")
    return "refers_to_agency_id IS NULL";
};

const makeNameFilterSQL = (name?: string): string | undefined => {
  if (!name) return;
  return format("name ILIKE '%' || %1$L || '%'", name);
};

const makeSiretFilterSQL = (siret?: string): string | undefined => {
  if (!siret) return;
  return format("agency_siret = %1$L", siret);
};

const makeDepartmentCodeFilterSQL = (
  departmentCode?: DepartmentCode,
): string | undefined => {
  if (!departmentCode) return;
  return format("covered_departments @> %L", `["${departmentCode}"]`);
};

const makePositionFilterSQL = (
  positionFilter?: AgencyPositionFilter,
): string | undefined => {
  if (!positionFilter) return;
  if (typeof positionFilter.distance_km !== "number")
    throw new Error("distance_km must be a number");
  return `ST_Distance(${STPointStringFromPosition(
    positionFilter.position,
  )}, position) <= ${positionFilter.distance_km * 1000}`;
};

const makeStatusFilterSQL = (
  statusFilter?: AgencyStatus[],
): string | undefined => {
  if (!statusFilter) return;
  return format("status IN (%1$L)", statusFilter);
};

export class PgAgencyRepository implements AgencyRepository {
  constructor(private transaction: KyselyDb) {}

  public async alreadyHasActiveAgencyWithSameAddressAndKind({
    idToIgnore,
    kind,
    address,
  }: {
    idToIgnore: AgencyId;
    kind: AgencyKind;
    address: AddressDto;
  }) {
    const alreadyExistingAgencies = await this.transaction
      .selectFrom("agencies")
      .selectAll()
      .where("kind", "=", kind)
      .where("status", "!=", "rejected")
      .where("street_number_and_address", "=", address.streetNumberAndAddress)
      .where("city", "=", address.city)
      .where("id", "!=", idToIgnore)
      .execute();

    return alreadyExistingAgencies.length > 0;
  }

  public async getAgencies({
    filters = {},
    limit,
  }: {
    filters?: GetAgenciesFilter;
    limit?: number;
  }): Promise<AgencyDto[]> {
    const filtersSQL = [
      makeDepartmentCodeFilterSQL(filters.departmentCode),
      makeNameFilterSQL(filters.nameIncludes),
      makeAgencyKindFilterSQL(filters.kind),
      makePositionFilterSQL(filters.position),
      makeStatusFilterSQL(filters.status),
      makeSiretFilterSQL(filters.siret),
    ].filter(filterNotFalsy);

    const whereClause =
      filtersSQL.length > 0 ? `WHERE ${filtersSQL.join(" AND ")}` : "";
    const limitClause = `LIMIT ${Math.min(
      limit ?? MAX_AGENCIES_RETURNED,
      MAX_AGENCIES_RETURNED,
    )}`;
    const sortClause = filters.position
      ? `ORDER BY ST_Distance(${STPointStringFromPosition(
          filters.position.position,
        )}, position)`
      : "";

    const query = [
      "SELECT *, ST_AsGeoJSON(position) AS position FROM agencies",
      ...(whereClause ? [whereClause] : []),
      ...(sortClause ? [sortClause] : []),
      ...(limitClause ? [limitClause] : []),
    ].join("\n");

    const pgResult = await executeKyselyRawSqlQuery<PersistenceAgency>(
      this.transaction,
      query,
    );

    const agenciesWithoutEmails = pgResult.rows.map(
      persistenceAgencyToAgencyDto,
    );

    const agencies = await this.#addEmailsToAgencies(agenciesWithoutEmails);

    return validateAndParseZodSchema(z.array(agencySchema), agencies, logger);
  }

  public async getAgenciesRelatedToAgency(id: AgencyId): Promise<AgencyDto[]> {
    const agenciesWithoutEmails =
      await this.#getAgencyWithJsonBuiltQueryBuilder()
        .where("a.refers_to_agency_id", "=", id)
        .orderBy("a.updated_at", "desc")
        .execute()
        .then(map((row) => row.agency));

    return this.#addEmailsToAgencies(agenciesWithoutEmails);
  }

  public async getById(id: AgencyId): Promise<AgencyDto | undefined> {
    const agencyWithoutEmails = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("a.id", "=", id)
      .executeTakeFirst()
      .then((row) => row?.agency);

    if (!agencyWithoutEmails) return;

    return this.#addEmailsToAgency(agencyWithoutEmails);
  }

  public async getByIds(ids: AgencyId[]): Promise<AgencyDto[]> {
    if (ids.length === 0) return [];
    const agenciesWithoutEmails =
      await this.#getAgencyWithJsonBuiltQueryBuilder()
        .where("a.id", "in", ids)
        .orderBy("a.updated_at", "desc")
        .execute()
        .then(map((row) => row.agency));
    const missingIds = ids.filter(
      (id) => !agenciesWithoutEmails.some((agency) => agency.id === id),
    );

    if (missingIds.length)
      throw new NotFoundError(someAgenciesMissingMessage(missingIds));

    return this.#addEmailsToAgencies(agenciesWithoutEmails);
  }

  public async getBySafir(safirCode: string): Promise<AgencyDto | undefined> {
    const agenciesWithoutEmails =
      await this.#getAgencyWithJsonBuiltQueryBuilder()
        .where("a.code_safir", "=", safirCode)
        .execute()
        .then(map((row) => row.agency));

    if (!agenciesWithoutEmails.length) return;

    if (agenciesWithoutEmails.length > 1)
      throw new ConflictError(
        safirConflictErrorMessage(safirCode, agenciesWithoutEmails),
      );

    return this.#addEmailsToAgency(agenciesWithoutEmails[0]);
  }

  public async getImmersionFacileAgencyId(): Promise<AgencyId | undefined> {
    return this.transaction
      .selectFrom("agencies")
      .select("id")
      .where("kind", "=", "immersion-facile")
      .executeTakeFirst()
      .then((row) => row?.id);
  }

  public async insert(agency: AgencyDto): Promise<AgencyId | undefined> {
    const pgAgency: InsertPgAgency = {
      id: agency.id,
      name: agency.name,
      status: agency.status,
      kind: agency.kind,
      questionnaire_url: agency.questionnaireUrl,
      email_signature: agency.signature,
      logo_url: agency.logoUrl,
      position: sql`ST_MakePoint(${agency.position.lon}, ${agency.position.lat})`,
      agency_siret: agency.agencySiret,
      code_safir: agency.codeSafir,
      street_number_and_address: agency.address?.streetNumberAndAddress,
      post_code: agency.address?.postcode,
      city: agency.address?.city,
      department_code: agency.address?.departmentCode,
      covered_departments: JSON.stringify(agency.coveredDepartments),
      refers_to_agency_id: agency.refersToAgencyId,
      acquisition_campaign: agency.acquisitionCampaign,
      acquisition_keyword: agency.acquisitionKeyword,
    };

    try {
      await this.transaction.insertInto("agencies").values(pgAgency).execute();

      await Promise.all(
        agency.counsellorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(email, agency.id, "counsellor"),
        ),
      );

      await Promise.all(
        agency.validatorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(email, agency.id, "validator"),
        ),
      );
    } catch (error: any) {
      // Detect attempts to re-insert an existing key (error code 23505: unique_violation)
      // See https://www.postgresql.org/docs/10/errcodes-appendix.html
      if (error.code === "23505") {
        logger.error(error, error.detail);
        return undefined;
      }
      throw error;
    }

    return agency.id;
  }

  public async update(agency: PartialAgencyDto): Promise<void> {
    await this.transaction
      .updateTable("agencies")
      .set({
        name: agency.name,
        status: agency.status,
        kind: agency.kind,
        questionnaire_url: agency.questionnaireUrl,
        email_signature: agency.signature,
        logo_url: agency.logoUrl,
        position: agency.position
          ? sql`ST_MakePoint(${agency.position.lon}, ${agency.position.lat})`
          : undefined,
        agency_siret: agency.agencySiret,
        code_safir: agency.codeSafir,
        street_number_and_address: agency.address?.streetNumberAndAddress,
        post_code: agency.address?.postcode,
        city: agency.address?.city,
        department_code: agency.address?.departmentCode,
        covered_departments:
          agency.coveredDepartments &&
          JSON.stringify(agency.coveredDepartments),
        refers_to_agency_id: agency.refersToAgencyId,
        updated_at: sql`NOW()`,
        rejection_justification: agency.rejectionJustification,
      })
      .where("id", "=", agency.id)
      .execute();

    if (agency.counsellorEmails) {
      await this.transaction
        .deleteFrom("users__agencies")
        .where(usersAgenciesRolesIncludeCounsellor)
        .where("is_notified_by_email", "=", true)
        .where("agency_id", "=", agency.id)
        .execute();

      await Promise.all(
        agency.counsellorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(email, agency.id, "counsellor"),
        ),
      );
    }

    if (agency.validatorEmails) {
      await this.transaction
        .deleteFrom("users__agencies")
        .where(usersAgenciesRolesIncludeValidator)
        .where("is_notified_by_email", "=", true)
        .where("agency_id", "=", agency.id)
        .execute();

      await Promise.all(
        agency.validatorEmails.map(async (email) =>
          this.#addUserAndAgencyRights(email, agency.id, "validator"),
        ),
      );
    }
  }

  async #addUserAndAgencyRights(
    email: Email,
    agencyId: AgencyId,
    role: AgencyRole,
  ) {
    const result = await this.transaction
      .insertInto("users")
      .values({
        id: sql`uuid_generate_v4()`,
        email,
        first_name: "",
        last_name: "",
        external_id: null,
      })
      .onConflict((oc) => oc.doNothing())
      .returning("id as userId")
      .executeTakeFirst();

    const userId = result
      ? result.userId
      : await this.transaction
          .selectFrom("users")
          .select("id")
          .where("email", "=", email)
          .executeTakeFirst()
          .then((row) => row?.id);

    if (!userId) throw new Error(`User with ${email} not created`);

    await this.transaction
      .insertInto("users__agencies")
      .values({
        user_id: userId,
        agency_id: agencyId,
        roles: JSON.stringify([role]),
        is_notified_by_email: true,
      })
      .onConflict((oc) =>
        oc
          .columns(["user_id", "agency_id"])
          .doUpdateSet({ is_notified_by_email: true }),
      )
      .execute();
  }

  async #addEmailsToAgency(
    agencyWithoutEmail: AgencyWithoutEmails,
  ): Promise<AgencyDto> {
    const userRows = await getUsersWithAgencyRole(this.transaction, {
      agencyIds: [agencyWithoutEmail.id],
      isNotifiedByEmail: true,
    });

    return addEmailsToAgency(userRows)(agencyWithoutEmail);
  }

  async #addEmailsToAgencies(
    agenciesWithoutEmails: AgencyWithoutEmails[],
  ): Promise<AgencyDto[]> {
    if (!agenciesWithoutEmails.length) return [];
    const userRows = await getUsersWithAgencyRole(this.transaction, {
      agencyIds: agenciesWithoutEmails.map(({ id }) => id),
      isNotifiedByEmail: true,
    });

    return agenciesWithoutEmails.map(addEmailsToAgency(userRows));
  }

  #getAgencyWithJsonBuiltQueryBuilder = () =>
    this.transaction.selectFrom("agencies as a").select(({ ref }) => [
      jsonBuildObject({
        id: cast<AgencyId>(ref("a.id")),
        name: ref("a.name"),
        status: cast<AgencyStatus>(ref("a.status")),
        kind: cast<AgencyKind>(ref("a.kind")),
        questionnaireUrl: sql<AbsoluteUrl>`${ref("a.questionnaire_url")}`,
        logoUrl: sql<AbsoluteUrl>`${ref("a.logo_url")}`,
        position: jsonBuildObject({
          lat: sql<number>`(ST_AsGeoJSON(${ref(
            "a.position",
          )})::json->'coordinates'->>1)::numeric`,
          lon: sql<number>`(ST_AsGeoJSON(${ref(
            "a.position",
          )})::json->'coordinates'->>0)::numeric`,
        }),
        address: jsonBuildObject({
          streetNumberAndAddress: ref("a.street_number_and_address"),
          postcode: ref("a.post_code"),
          city: ref("a.city"),
          departmentCode: ref("a.department_code"),
        }),
        coveredDepartments: cast<DepartmentCode[]>(
          ref("a.covered_departments"),
        ),
        agencySiret: ref("a.agency_siret"),
        codeSafir: ref("a.code_safir"),
        signature: ref("a.email_signature"),
        refersToAgencyId: cast<AgencyId>(ref("a.refers_to_agency_id")),
        rejectionJustification: ref("a.rejection_justification"),
      }).as("agency"),
    ]);
}

const STPointStringFromPosition = (position: GeoPositionDto) =>
  `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;

const persistenceAgencyToAgencyDto = (
  params: PersistenceAgency,
): AgencyWithoutEmails => ({
  coveredDepartments: params.covered_departments,
  address: {
    streetNumberAndAddress: params.street_number_and_address,
    postcode: params.post_code,
    departmentCode: params.department_code,
    city: params.city,
  },
  agencySiret: params.agency_siret,
  codeSafir: params.code_safir,
  id: params.id,
  kind: params.kind,
  logoUrl: params.logo_url,
  name: params.name,
  position: parseGeoJson(params.position),
  questionnaireUrl: params.questionnaire_url,
  signature: params.email_signature,
  status: params.status,
  rejectionJustification: params.rejection_justification,
  refersToAgencyId: params.refers_to_agency_id,
});

const parseGeoJson = (raw: string): GeoPositionDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};
export const safirConflictErrorMessage = (
  safirCode: string,
  agencies: Pick<AgencyDto, "id">[],
): any =>
  `Multiple agencies were found with safir code "${safirCode}": ${agencies
    .map(({ id }) => id)
    .sort()
    .join(",")}`;
