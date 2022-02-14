import { PoolClient } from "pg";
import format from "pg-format";
import {
  AgencyConfig,
  AgencyRepository,
} from "../../../domain/immersionApplication/ports/AgencyRepository";
import { AgencyId } from "../../../shared/agencies";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { createLogger } from "../../../utils/logger";
import { parseGeoJson } from "./PgImmersionOfferRepository";

const logger = createLogger(__filename);

const MAX_NEARBY_DISTANCE = 100_000; // = 100km

export class PgAgencyRepository implements AgencyRepository {
  constructor(private client: PoolClient) {}

  public async getAllActive(): Promise<AgencyConfig[]> {
    const pgResult = await this.client.query(
      "SELECT id, name, status, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, ST_AsGeoJSON(position) AS position\
       FROM public.agencies\
       WHERE status = 'active'",
    );
    return pgResult.rows.map(pgToEntity);
  }

  public async getNearby(searchPosition: LatLonDto): Promise<AgencyConfig[]> {
    const pgResult = await this.client.query(
      `SELECT id, name, status, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, ST_AsGeoJSON(position) AS position,
        ST_Distance(${STPointStringFromPosition(
          searchPosition,
        )}, position) as dist
        
      FROM public.agencies
      
      WHERE status = 'active' AND ST_Distance(${STPointStringFromPosition(
        searchPosition,
      )}, position) <= ${MAX_NEARBY_DISTANCE}
      
      ORDER BY dist
      LIMIT 20`,
    );

    return pgResult.rows.map(pgToEntity);
  }

  public async getById(id: AgencyId): Promise<AgencyConfig | undefined> {
    const pgResult = await this.client.query(
      "SELECT id, name, status, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, ST_AsGeoJSON(position) AS position\
      FROM public.agencies\
      WHERE id = $1",
      [id],
    );

    const pgConfig = pgResult.rows[0];
    if (!pgConfig) return;

    return pgToEntity(pgConfig);
  }

  public async insert(agency: AgencyConfig): Promise<AgencyId | undefined> {
    const query = `INSERT INTO public.agencies(
      id, name, status, address, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, position
    ) VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %s)`;
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
}

const STPointStringFromPosition = (position: LatLonDto) =>
  `public.st_geographyfromtext('POINT(${position.lon} ${position.lat})'::text)`;

const entityToPgArray = (agency: AgencyConfig): any[] => [
  agency.id,
  agency.name,
  agency.status,
  agency.address,
  JSON.stringify(agency.counsellorEmails),
  JSON.stringify(agency.validatorEmails),
  JSON.stringify(agency.adminEmails),
  agency.questionnaireUrl || null,
  agency.signature,
  STPointStringFromPosition(agency.position),
];

const pgToEntity = (params: Record<any, any>): AgencyConfig => ({
  id: params.id,
  name: params.name,
  status: params.status,
  address: params.address,
  counsellorEmails: params.counsellor_emails,
  validatorEmails: params.validator_emails,
  adminEmails: params.admin_emails,
  questionnaireUrl: params.questionnaire_url,
  signature: params.email_signature,
  position: parseGeoJson(params.position),
});
