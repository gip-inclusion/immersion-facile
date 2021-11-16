import {
  RomeGateway,
  RomeMetier,
  RomeAppellation,
} from "../../../domain/rome/ports/RomeGateway";
import { PoolClient } from "pg";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class PgRomeGateway implements RomeGateway {
  constructor(private client: PoolClient) {}

  appellationToCodeMetier(
    romeCodeAppellation: string,
  ): Promise<string | undefined> {
    return this.client
      .query(
        "SELECT code_rome FROM appellations_public_data WHERE ogr_appellation=$1",
        [romeCodeAppellation],
      )
      .then((res) => res.rows[0].code_rome)
      .catch((e) => {
        logger.error(e);
        return;
      });
  }

  public async searchMetier(query: string): Promise<RomeMetier[]> {
    const queryWithPatternCode = "%" + query + "%";
    return this.client
      .query(
        "SELECT code_rome, libelle_rome FROM romes_public_data WHERE libelle_rome_tsvector@@to_tsquery('french', $1) OR libelle_rome ILIKE $2",
        [query, queryWithPatternCode],
      )
      .then((res) =>
        res.rows.map((x) => {
          const romeMetier: RomeMetier = {
            codeMetier: x.code_rome,
            libelle: x.libelle_rome,
          };
          return romeMetier;
        }),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  public async searchAppellation(query: string): Promise<RomeAppellation[]> {
    const queryWithPatternCode = "%" + query + "%";
    return await this.client
      .query(
        "SELECT ogr_appellation as codeAppellation, libelle_appellation_court as libelle, code_rome as rome FROM appellations_public_data WHERE libelle_appellation_long_tsvector @@ to_tsquery('french',$1)  OR libelle_appellation_long ILIKE $2",
        [query, queryWithPatternCode],
      )
      .then((res) => res.rows as RomeAppellation[])
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }
}
