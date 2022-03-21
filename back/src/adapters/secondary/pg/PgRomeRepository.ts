import { PoolClient } from "pg";
import {
  RomeAppellation,
  RomeRepository,
  RomeMetier,
} from "../../../domain/rome/ports/RomeRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class PgRomeRepository implements RomeRepository {
  constructor(private client: PoolClient) {}

  appellationToCodeMetier(
    romeCodeAppellation: string,
  ): Promise<string | undefined> {
    return this.client
      .query(
        `SELECT code_rome
        FROM public_appelations_data
        WHERE ogr_appellation=$1`,
        [romeCodeAppellation],
      )
      .then((res) => {
        try {
          return res.rows[0].code_rome;
        } catch (_) {
          logger.error(
            { romeCodeAppellation, resultFromQuery: res },
            "could not fetch rome code with given appellation",
          );

          return;
        }
      })
      .catch((e) => {
        logger.error(e);
        return;
      });
  }

  public async searchMetier(query: string): Promise<RomeMetier[]> {
    return this.client
      .query(
        `SELECT code_rome, libelle_rome
        FROM public_romes_data
        WHERE
          libelle_rome_tsvector@@to_tsquery('french', $1)
          OR libelle_rome ILIKE $2`,
        [toTsQuery(query), `%${query}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeMetier => ({
            codeMetier: row.code_rome,
            libelle: row.libelle_rome,
          }),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  public async searchAppellation(query: string): Promise<RomeAppellation[]> {
    const queryWords = query.split(" ");
    const lastWord = queryWords[queryWords.length - 1];
    const queryBeginning =
      queryWords.length === 1
        ? queryWords.join(" ")
        : queryWords.slice(0, queryWords.length - 1).join(" ");

    return await this.client
      .query(
        `SELECT ogr_appellation, libelle_appellation_court, code_rome
        FROM public_appelations_data
        WHERE
           (libelle_appellation_long_tsvector @@ to_tsquery('french',$1) AND libelle_appellation_long ILIKE $3)
           OR (libelle_appellation_long ILIKE $2 AND libelle_appellation_long ILIKE $3)
        LIMIT 80`,
        [toTsQuery(queryBeginning), `%${queryBeginning}%`, `%${lastWord}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeAppellation => ({
            codeAppellation: row.ogr_appellation,
            libelle: row.libelle_appellation_court,
            codeMetier: row.code_rome,
          }),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }
}

const toTsQuery = (query: string): string => query.split(/\s+/).join(" & ");
