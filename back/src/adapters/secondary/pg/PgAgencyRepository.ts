import { PoolClient } from "pg";
import format from "pg-format";
import {
  AgencyDto,
  AgencyId,
  AgencyKindFilter,
  AgencyPositionFilter,
  AgencyStatus,
  DepartmentCode,
  GeoPositionDto,
  GetAgenciesFilter,
  PartialAgencyDto,
} from "shared";
import { AgencyRepository } from "../../../domain/convention/ports/AgencyRepository";
import { createLogger } from "../../../utils/logger";
import { optional } from "./pgUtils";

const logger = createLogger(__filename);

const MAX_AGENCIES_RETURNED = 100;

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

type AgencyPgRow = Record<AgencyColumns, any>;

const makeAgencyKindFiterSQL = (
  agencyKindFilter?: AgencyKindFilter,
): string | undefined => {
  if (agencyKindFilter === "immersionPeOnly") return "kind = 'pole-emploi'";
  if (agencyKindFilter === "immersionWithoutPe")
    return "kind != 'pole-emploi' AND kind != 'cci'";
  if (agencyKindFilter === "miniStageOnly") return "kind = 'cci'";
  if (agencyKindFilter === "miniStageExcluded") return "kind != 'cci'";
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

const makePositionFiterSQL = (
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
  constructor(private client: PoolClient) {}

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
      makeAgencyKindFiterSQL(filters.kind),
      makePositionFiterSQL(filters.position),
      makeStatusFilterSQL(filters.status),
    ].filter((clause) => !!clause);

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
      "SELECT *, ST_AsGeoJSON(position) AS position FROM public.agencies",
      ...(whereClause ? [whereClause] : []),
      ...(sortClause ? [sortClause] : []),
      ...(limitClause ? [limitClause] : []),
    ].join("\n");

    const pgResult = await this.client.query(query);
    return pgResult.rows.map(pgToEntity);
  }

  public async getAgencyWhereEmailMatches(email: string) {
    const positionAsCoordinates = "ST_AsGeoJSON(position) AS position";
    const validatorEmailsIncludesProvidedEmail =
      "CAST(validator_emails AS text) ILIKE '%' || $1 || '%'";
    const councellorEmailsIncludesProvidedEmail =
      "CAST(counsellor_emails AS text) ILIKE '%' || $1 || '%'";

    const pgResult = await this.client.query(
      `SELECT id, name, status, kind, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, ${positionAsCoordinates}, agency_siret, code_safir,
        street_number_and_address, post_code, city, department_code
       FROM public.agencies
       WHERE ${validatorEmailsIncludesProvidedEmail} OR ${councellorEmailsIncludesProvidedEmail}`,
      [email],
    );

    const first = pgResult.rows[0];

    if (!first) return;
    return pgToEntity(first);
  }

  public async getById(id: AgencyId): Promise<AgencyDto | undefined> {
    const pgResult = await this.client.query(
      "SELECT id, name, status, kind, counsellor_emails, validator_emails, \
        admin_emails, questionnaire_url, email_signature, logo_url, ST_AsGeoJSON(position) AS position, \
        street_number_and_address, post_code, city, department_code \
      FROM public.agencies\
      WHERE id = $1",
      [id],
    );

    const pgAgency = pgResult.rows[0];
    if (!pgAgency) return;

    return pgToEntity(pgAgency);
  }

  public async insert(agency: AgencyDto): Promise<AgencyId | undefined> {
    const query = `INSERT INTO public.agencies(
      id, name, status, kind, counsellor_emails, validator_emails, admin_emails, 
      questionnaire_url, email_signature, logo_url, position, agency_siret, code_safir,
      street_number_and_address, post_code, city, department_code
    ) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %s, %L, %L, %L, %L, %L, %L)`;
    try {
      await this.client.query(format(query, ...entityToPgArray(agency)));
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
    const query = `UPDATE public.agencies SET
      name = COALESCE(%2$L, name),
      status = COALESCE(%3$L, status),
      kind= COALESCE(%4$L, kind),
      counsellor_emails= COALESCE(%5$L, counsellor_emails),
      validator_emails= COALESCE(%6$L, validator_emails),
      admin_emails= COALESCE(%7$L, admin_emails),
      questionnaire_url= COALESCE(%8$L, questionnaire_url),
      email_signature = COALESCE(%9$L, email_signature),
      logo_url = COALESCE(%10$L, logo_url),
      ${agency.position ? "position = ST_GeographyFromText(%11$L)," : ""}
      agency_siret = COALESCE(%12$L, agency_siret),
      code_safir = COALESCE(%13$L, code_safir),
      street_number_and_address = COALESCE(%14$L, street_number_and_address),
      post_code = COALESCE(%15$L, post_code),
      city = COALESCE(%16$L, city),
      department_code = COALESCE(%17$L, department_code),
      updated_at = NOW()
    WHERE id = %1$L`;

    const params = entityToPgArray(agency);
    params[10] =
      agency.position && `POINT(${agency.position.lon} ${agency.position.lat})`;
    await this.client.query(format(query, ...params));
  }

  async getImmersionFacileAgencyId(): Promise<AgencyId | undefined> {
    const pgResult = await this.client.query(`
           SELECT id 
           FROM agencies
           WHERE agencies.kind = 'immersion-facile'
           LIMIT 1
           `);

    return pgResult.rows[0]?.id;
  }
}

const STPointStringFromPosition = (position: GeoPositionDto) =>
  `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;

const entityToPgArray = (agency: Partial<AgencyDto>): any[] => [
  agency.id,
  agency.name,
  agency.status,
  agency.kind,
  agency.counsellorEmails && JSON.stringify(agency.counsellorEmails),
  agency.validatorEmails && JSON.stringify(agency.validatorEmails),
  agency.adminEmails && JSON.stringify(agency.adminEmails),
  agency.questionnaireUrl,
  agency.signature,
  agency.logoUrl,
  agency.position && STPointStringFromPosition(agency.position),
  agency.agencySiret,
  agency.codeSafir,
  agency.address?.streetNumberAndAddress,
  agency.address?.postcode,
  agency.address?.city,
  agency.address?.departmentCode,
];

const pgToEntity = (params: AgencyPgRow): AgencyDto => ({
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
});

export const parseGeoJson = (raw: string): GeoPositionDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};
