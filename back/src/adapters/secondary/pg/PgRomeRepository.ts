import { PoolClient } from "pg";
import { RomeRepository } from "../../../domain/rome/ports/RomeRepository";
import {
  AppellationDto,
  RomeDto,
} from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
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
        FROM public_appellations_data
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

  public async searchRome(query: string): Promise<RomeDto[]> {
    const [queryBeginning, lastWord] = prepareQueryParams(query);

    return await this.client
      .query(
        `SELECT DISTINCT public_appellations_data.code_rome, libelle_rome
        FROM public_appellations_data 
        JOIN public_romes_data ON  public_appellations_data.code_rome = public_romes_data.code_rome
        WHERE
           (libelle_appellation_long_tsvector @@ to_tsquery('french',$1) AND libelle_appellation_long_without_special_char ILIKE $3)
           OR (libelle_appellation_long_without_special_char ILIKE $2 AND libelle_appellation_long_without_special_char ILIKE $3)
        LIMIT 80`,
        [toTsQuery(queryBeginning), `%${queryBeginning}%`, `%${lastWord}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeDto => ({
            romeCode: row.code_rome,
            romeLabel: row.libelle_rome,
          }),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  public async searchAppellation(query: string): Promise<AppellationDto[]> {
    const [queryBeginning, lastWord] = prepareQueryParams(query);

    return await this.client
      .query(
        `SELECT ogr_appellation, libelle_appellation_long, public_appellations_data.code_rome, libelle_rome
        FROM public_appellations_data 
        JOIN public_romes_data ON  public_appellations_data.code_rome = public_romes_data.code_rome
        WHERE
           (libelle_appellation_long_tsvector @@ to_tsquery('french',$1) AND libelle_appellation_long_without_special_char ILIKE $3)
           OR (libelle_appellation_long_without_special_char ILIKE $2 AND libelle_appellation_long_without_special_char ILIKE $3)
        LIMIT 80`,
        [toTsQuery(queryBeginning), `%${queryBeginning}%`, `%${lastWord}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): AppellationDto => ({
            appellationCode: row.ogr_appellation.toString(),
            romeCode: row.code_rome,
            appellationLabel: row.libelle_appellation_long,
            romeLabel: row.libelle_rome,
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

const prepareQueryParams = (query: string): [string, string] => {
  const queryWords = query.split(" ");
  const lastWord = removeAccentAndParentheses(
    queryWords[queryWords.length - 1],
  );
  const queryBeginning = removeAccentAndParentheses(
    queryWords.length === 1
      ? queryWords.join(" ")
      : queryWords.slice(0, queryWords.length - 1).join(" "),
  );

  return [queryBeginning, lastWord];
};

const removeAccentAndParentheses = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "");
