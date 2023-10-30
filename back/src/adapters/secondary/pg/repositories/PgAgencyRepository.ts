import { InsertObject, sql } from "kysely";
import format from "pg-format";
import { map } from "ramda";
import {
  AbsoluteUrl,
  AgencyDto,
  AgencyId,
  AgencyKind,
  AgencyKindFilter,
  AgencyPositionFilter,
  agencySchema,
  AgencyStatus,
  DepartmentCode,
  Email,
  filterNotFalsy,
  GeoPositionDto,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";
import {
  AgencyRepository,
  someAgenciesMissingMessage,
} from "../../../../domain/convention/ports/AgencyRepository";
import { createLogger } from "../../../../utils/logger";
import {
  NotFoundError,
  validateAndParseZodSchema,
} from "../../../primary/helpers/httpErrors";
import {
  cast,
  executeKyselyRawSqlQuery,
  jsonBuildObject,
  jsonStripNulls,
  KyselyDb,
} from "../kysely/kyselyUtils";
import { Database } from "../kysely/model/database";
import { optional } from "../pgUtils";

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
  | "validator_emails";

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

const makeDepartmentCodeFilterSQL = (
  departmentCode?: DepartmentCode,
): string | undefined => {
  if (!departmentCode) return;
  return format("department_code =%1$L", departmentCode);
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
    return pgResult.rows.map(persistenceAgencyToAgencyDto);
  }

  public async getAgencyWhereEmailMatches(email: string) {
    const positionAsCoordinates = "ST_AsGeoJSON(position) AS position";
    const validatorEmailsIncludesProvidedEmail =
      "CAST(validator_emails AS text) ILIKE '%' || $1 || '%'";
    const councellorEmailsIncludesProvidedEmail =
      "CAST(counsellor_emails AS text) ILIKE '%' || $1 || '%'";

    const pgResult = await executeKyselyRawSqlQuery<PersistenceAgency>(
      this.transaction,
      `SELECT id, name, status, kind, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, ${positionAsCoordinates}, agency_siret, code_safir,
        street_number_and_address, post_code, city, department_code
       FROM public.agencies
       WHERE ${validatorEmailsIncludesProvidedEmail} OR ${councellorEmailsIncludesProvidedEmail}`,
      [email],
    );

    const first = pgResult.rows[0];

    if (!first) return;
    return persistenceAgencyToAgencyDto(first);
  }

  public async getById(id: AgencyId): Promise<AgencyDto | undefined> {
    return this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("a.id", "=", id)
      .executeTakeFirst()
      .then((row) => row?.agency);
  }

  public async getByIds(ids: AgencyId[]): Promise<AgencyDto[]> {
    const agencies = await this.#getAgencyWithJsonBuiltQueryBuilder()
      .where("a.id", "in", ids)
      .orderBy("a.updated_at", "desc")
      .execute()
      .then(map((row) => row.agency));
    const missingIds = ids.filter(
      (id) => !agencies.some((agency) => agency.id === id),
    );

    if (missingIds.length)
      throw new NotFoundError(someAgenciesMissingMessage(missingIds));
    return agencies;
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
      counsellor_emails:
        agency.counsellorEmails && JSON.stringify(agency.counsellorEmails),
      validator_emails:
        agency.validatorEmails && JSON.stringify(agency.validatorEmails),
      admin_emails: agency.adminEmails && JSON.stringify(agency.adminEmails),
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
      refers_to_agency_id: agency.refersToAgencyId,
    };

    try {
      await this.transaction.insertInto("agencies").values(pgAgency).execute();
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
        counsellor_emails:
          agency.counsellorEmails && JSON.stringify(agency.counsellorEmails),
        validator_emails:
          agency.validatorEmails && JSON.stringify(agency.validatorEmails),
        admin_emails: agency.adminEmails && JSON.stringify(agency.adminEmails),
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
        refers_to_agency_id: agency.refersToAgencyId,
        updated_at: sql`NOW()`,
      })
      .where("id", "=", agency.id)
      .execute();
  }

  #getAgencyWithJsonBuiltQueryBuilder = () =>
    this.transaction.selectFrom("agencies as a").select(({ ref }) => [
      jsonStripNulls(
        jsonBuildObject({
          id: cast<AgencyId>(ref("a.id")),
          name: ref("a.name"),
          status: cast<AgencyStatus>(ref("a.status")),
          kind: cast<AgencyKind>(ref("a.kind")),
          counsellorEmails: sql<Email[]>`${ref("a.counsellor_emails")}`,
          validatorEmails: sql<Email[]>`${ref("a.validator_emails")}`,
          questionnaireUrl: ref("a.questionnaire_url"),
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
          agencySiret: ref("a.agency_siret"),
          codeSafir: ref("a.code_safir"),
          adminEmails: sql<Email[]>`${ref("a.admin_emails")}`,
          signature: ref("a.email_signature"),
          refersToAgencyId: cast<AgencyId>(ref("a.refers_to_agency_id")),
        }),
      ).as("agency"),
    ]);
}

const STPointStringFromPosition = (position: GeoPositionDto) =>
  `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;

const persistenceAgencyToAgencyDto = (params: PersistenceAgency): AgencyDto =>
  validateAndParseZodSchema(
    agencySchema,
    {
      address: {
        streetNumberAndAddress: params.street_number_and_address,
        postcode: params.post_code,
        departmentCode: params.department_code,
        city: params.city,
      },
      adminEmails: params.admin_emails,
      agencySiret: optional(params.agency_siret),
      codeSafir: optional(params.code_safir),
      counsellorEmails: params.counsellor_emails,
      id: params.id,
      kind: params.kind,
      logoUrl: optional(params.logo_url),
      name: params.name,
      position: parseGeoJson(params.position),
      questionnaireUrl: params.questionnaire_url,
      signature: params.email_signature,
      status: params.status,
      validatorEmails: params.validator_emails,
    },
    logger,
  );

const parseGeoJson = (raw: string): GeoPositionDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};
