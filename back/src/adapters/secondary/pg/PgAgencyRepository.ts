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

export class PgAgencyRepository implements AgencyRepository {
  constructor(private client: PoolClient) {}

  public async getAll(): Promise<AgencyConfig[]> {
    const pgResult = await this.client.query(
      "SELECT id, name, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, ST_AsGeoJSON(position) AS position FROM public.agencies",
    );
    return pgResult.rows.map(pgToEntity);
  }

  public async getById(id: AgencyId): Promise<AgencyConfig | undefined> {
    const pgResult = await this.client.query(
      "SELECT id, name, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, ST_AsGeoJSON(position) AS position FROM public.agencies WHERE id = $1",
      [id],
    );

    const pgConfig = pgResult.rows[0];
    if (!pgConfig) return;

    return pgToEntity(pgConfig);
  }

  public async insert(config: AgencyConfig): Promise<AgencyId | undefined> {
    const query = `INSERT INTO public.agencies(
      id, name, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature, position
    ) VALUES (%L, %L, %L, %L, %L, %L, %L, %s)`;
    try {
      await this.client.query(format(query, ...entityToPgArray(config)));
    } catch (error: any) {
      // Detect attempts to re-insert an existing key (error code 23505: unique_violation)
      // See https://www.postgresql.org/docs/10/errcodes-appendix.html
      if (error.code === "23505") {
        logger.error(error, error.detail);
        return undefined;
      }
      throw error;
    }
    return config.id;
  }
}

const entityToPgArray = (config: AgencyConfig): any[] => {
  return [
    config.id,
    config.name,
    JSON.stringify(config.counsellorEmails),
    JSON.stringify(config.validatorEmails),
    JSON.stringify(config.adminEmails),
    config.questionnaireUrl || null,
    config.signature,
    `public.st_geographyfromtext('POINT(${config.position.lat} ${config.position.lon})'::text)`,
  ];
};

const pgToEntity = (params: Record<any, any>): AgencyConfig => {
  return {
    id: params.id,
    name: params.name,
    counsellorEmails: params.counsellor_emails,
    validatorEmails: params.validator_emails,
    adminEmails: params.admin_emails,
    questionnaireUrl: params.questionnaire_url,
    signature: params.email_signature,
    position: parseGeoJson(params.position),
  };
};
