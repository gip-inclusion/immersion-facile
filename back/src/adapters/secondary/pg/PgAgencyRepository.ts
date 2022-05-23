import { PoolClient } from "pg";
import format from "pg-format";
import { AgencyRepository } from "../../../domain/immersionApplication/ports/AgencyRepository";
import { AgencyConfig, AgencyId } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";
import { createLogger } from "../../../utils/logger";
import { optional } from "./pgUtils";

const logger = createLogger(__filename);

export class PgAgencyRepository implements AgencyRepository {
  constructor(private client: PoolClient) {}

  public async getAllActive(): Promise<AgencyConfig[]> {
    const pgResult = await this.client.query(
      "SELECT id, name, status, kind, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, ST_AsGeoJSON(position) AS position, agency_siret, code\
       FROM public.agencies\
       WHERE status = 'active'",
    );
    return pgResult.rows.map(pgToEntity);
  }

  public async getNearby(
    searchPosition: LatLonDto,
    distance_km: number,
  ): Promise<AgencyConfig[]> {
    if (typeof distance_km !== "number")
      throw new Error("distance_km must be a number");

    const pgResult = await this.client.query(
      `SELECT id, name, status, kind, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, ST_AsGeoJSON(position) AS position,
        ST_Distance(${STPointStringFromPosition(
          searchPosition,
        )}, position) as dist
        
      FROM public.agencies
      
      WHERE status = 'active' AND ST_Distance(${STPointStringFromPosition(
        searchPosition,
      )}, position) <= ${distance_km * 1000}
      
      
      ORDER BY dist
      LIMIT 20`,
    );

    return pgResult.rows.map(pgToEntity);
  }

  public async getAgencyWhereEmailMatches(email: string) {
    const positionAsCoordinates = "ST_AsGeoJSON(position) AS position";
    const validatorEmailsIncludesProvidedEmail =
      "CAST(validator_emails AS text) ILIKE '%' || $1 || '%'";
    const councellorEmailsIncludesProvidedEmail =
      "CAST(counsellor_emails AS text) ILIKE '%' || $1 || '%'";

    const pgResult = await this.client.query(
      `SELECT id, name, status, kind, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, ${positionAsCoordinates}, agency_siret, code
       FROM public.agencies
       WHERE ${validatorEmailsIncludesProvidedEmail} OR ${councellorEmailsIncludesProvidedEmail}`,
      [email],
    );

    const first = pgResult.rows[0];

    if (!first) return;
    return pgToEntity(first);
  }

  public async getById(id: AgencyId): Promise<AgencyConfig | undefined> {
    const pgResult = await this.client.query(
      "SELECT id, name, status, kind, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, ST_AsGeoJSON(position) AS position\
      FROM public.agencies\
      WHERE id = $1",
      [id],
    );

    const pgAgency = pgResult.rows[0];
    if (!pgAgency) return;

    return pgToEntity(pgAgency);
  }

  public async insert(agency: AgencyConfig): Promise<AgencyId | undefined> {
    const query = `INSERT INTO public.agencies(
      id, name, status, kind, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, logo_url, position
    ) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %s)`;
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

  public async update(agency: AgencyConfig): Promise<void> {
    const query = `UPDATE public.agencies SET
      name = $2,
      status = $3 ,
      kind = $4,
      address = $5,
      counsellor_emails = $6,
      validator_emails = $7,
      admin_emails = $8,
      questionnaire_url = $9,
      email_signature = $10,
      logo_url = $11,
      position = ST_GeographyFromText($12),
      agency_siret = $13,
      code = $14
    WHERE id = $1`;

    const params = entityToPgArray(agency);
    params[11] = `POINT(${agency.position.lon} ${agency.position.lat})`;

    await this.client.query(query, params);
  }

  async getImmersionFacileIdByKind(): Promise<AgencyId> {
    const pgResult = await this.client.query(`
           SELECT id 
           FROM agencies
           WHERE agencies.kind = 'immersion-facile'
           LIMIT 1
           `);

    return pgResult.rows[0]?.id;
  }
}

const STPointStringFromPosition = (position: LatLonDto) =>
  `ST_GeographyFromText('POINT(${position.lon} ${position.lat})')`;

const entityToPgArray = (agency: AgencyConfig): any[] => [
  agency.id,
  agency.name,
  agency.status,
  agency.kind,
  agency.address,
  JSON.stringify(agency.counsellorEmails),
  JSON.stringify(agency.validatorEmails),
  JSON.stringify(agency.adminEmails),
  agency.questionnaireUrl,
  agency.signature,
  agency.logoUrl,
  STPointStringFromPosition(agency.position),
  agency.agencySiret,
  agency.code,
];

const pgToEntity = (params: Record<any, any>): AgencyConfig => ({
  id: params.id,
  name: params.name,
  status: params.status,
  kind: params.kind,
  address: params.address,
  counsellorEmails: params.counsellor_emails,
  validatorEmails: params.validator_emails,
  adminEmails: params.admin_emails,
  questionnaireUrl: params.questionnaire_url,
  signature: params.email_signature,
  logoUrl: optional(params.logo_url),
  position: parseGeoJson(params.position),
  agencySiret: optional(params.agency_siret),
  code: optional(params.code),
});

export const parseGeoJson = (raw: string): LatLonDto => {
  const json = JSON.parse(raw);
  return {
    lat: json.coordinates[1],
    lon: json.coordinates[0],
  };
};
