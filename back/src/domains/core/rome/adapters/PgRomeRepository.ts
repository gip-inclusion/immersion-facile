import { sql } from "kysely";
import {
  AppellationAndRomeDto,
  AppellationCode,
  RomeDto,
  castError,
  removeDiacritics,
} from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../utils/logger";
import { RomeRepository } from "../ports/RomeRepository";

const logger = createLogger(__filename);

export class PgRomeRepository implements RomeRepository {
  constructor(private transaction: KyselyDb) {}

  public appellationToCodeMetier(
    romeCodeAppellation: AppellationCode,
  ): Promise<string | undefined> {
    return this.transaction
      .selectFrom("public_appellations_data")
      .where("ogr_appellation", "=", parseInt(romeCodeAppellation))
      .select("code_rome")
      .execute()
      .then((results) => {
        const romeCode = results.at(0)?.code_rome;
        if (romeCode) return romeCode;
        logger.error({
          message: `could not fetch rome code with given appellation ${romeCodeAppellation}, results: ${results}`,
        });
        return undefined;
      })
      .catch((e) => {
        logger.error(e);
        return undefined;
      });
  }

  public async getAppellationAndRomeDtosFromAppellationCodes(
    codes: AppellationCode[],
  ): Promise<AppellationAndRomeDto[]> {
    return this.transaction
      .selectFrom("public_appellations_data as appellations")
      .innerJoin(
        "public_romes_data as romes",
        "appellations.code_rome",
        "romes.code_rome",
      )
      .where(
        "appellations.ogr_appellation",
        "in",
        codes.map((code) => parseInt(code)),
      )
      .select([
        "appellations.ogr_appellation",
        "appellations.libelle_appellation_long",
        "romes.libelle_rome",
        "romes.code_rome",
      ])
      .execute()
      .then((results) =>
        results.map(
          (result) =>
            ({
              appellationCode: result.ogr_appellation.toString(),
              appellationLabel: result.libelle_appellation_long,
              romeCode: result.code_rome,
              romeLabel: result.libelle_rome,
            }) satisfies AppellationAndRomeDto,
        ),
      );
  }

  public searchAppellation(query: string): Promise<AppellationAndRomeDto[]> {
    const [queryBeginning, lastWord] = prepareQueryParams(query);
    const sanitizedQuery = toTsQuery(queryBeginning);
    return this.transaction
      .selectFrom("public_appellations_data")
      .innerJoin(
        "public_romes_data",
        "public_appellations_data.code_rome",
        "public_romes_data.code_rome",
      )
      .where((eb) =>
        eb.or([
          eb.and([
            eb.eb("libelle_appellation_long_without_special_char", "@@", (eb) =>
              eb.fn("to_tsquery", [sql`'french'`, sql`${sanitizedQuery}`]),
            ),
            eb.eb(
              "libelle_appellation_long_without_special_char",
              "ilike",
              `%${lastWord}%`,
            ),
          ]),
          eb.and([
            eb.eb(
              "libelle_appellation_long_without_special_char",
              "ilike",
              `%${queryBeginning}%`,
            ),
            eb.eb(
              "libelle_appellation_long_without_special_char",
              "ilike",
              `%${lastWord}%`,
            ),
          ]),
        ]),
      )
      .select([
        "public_appellations_data.ogr_appellation",
        "public_appellations_data.libelle_appellation_long",
        "public_romes_data.libelle_rome",
        "public_romes_data.code_rome",
      ])
      .limit(80)
      .execute()
      .then((results) =>
        results.map(
          (result) =>
            ({
              appellationCode: result.ogr_appellation.toString(),
              appellationLabel: result.libelle_appellation_long,
              romeCode: result.code_rome,
              romeLabel: result.libelle_rome,
            }) satisfies AppellationAndRomeDto,
        ),
      )
      .catch((error) => {
        logger.error({
          error: { error: castError(error), query },
          message: "searchAppellation error",
        });
        return [];
      });
  }

  public searchRome(query: string): Promise<RomeDto[]> {
    const [queryBeginning, lastWord] = prepareQueryParams(query);

    return this.transaction
      .with("search_corpus", (eb) =>
        eb
          .selectFrom("public_romes_data")
          .select([
            "public_romes_data.code_rome as code_rome",
            "public_romes_data.libelle_rome as searchable_text",
            "public_romes_data.libelle_rome_tsvector as ts_vector",
          ])
          .unionAll(
            eb
              .selectFrom("public_appellations_data")
              .select([
                "public_appellations_data.code_rome as code_rome",
                "public_appellations_data.libelle_appellation_long_without_special_char as searchable_text",
                "public_appellations_data.libelle_appellation_long_tsvector as ts_vector",
              ]),
          ),
      )
      .with("matching_rome", (eb) =>
        eb

          .selectFrom("search_corpus")
          .where((eb) =>
            eb.or([
              eb.and([
                eb.eb("ts_vector", "@@", (eb) =>
                  eb.fn("to_tsquery", [
                    sql`'french'`,
                    sql`${toTsQuery(queryBeginning)}`,
                  ]),
                ),
                eb.eb("searchable_text", "ilike", `%${lastWord}%`),
              ]),
              eb.and([
                eb.eb("searchable_text", "ilike", `%${queryBeginning}%`),
                eb.eb("searchable_text", "ilike", `%${lastWord}%`),
              ]),
            ]),
          )
          .select("code_rome")
          .distinct()
          .limit(80),
      )
      .selectFrom("matching_rome")
      .innerJoin(
        "public_romes_data",
        "matching_rome.code_rome",
        "public_romes_data.code_rome",
      )
      .select(["public_romes_data.code_rome", "public_romes_data.libelle_rome"])
      .execute()
      .then((results) =>
        results.map((result) => ({
          romeCode: result.code_rome,
          romeLabel: result.libelle_rome,
        })),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }
}

const toTsQuery = (input: string): string =>
  input
    .replace(/[\/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/'(?=\s|$)|(?<=\s|^)'/g, "")
    .trim()
    .replace(/\s+/g, " & ");

const prepareQueryParams = (query: string): [string, string] => {
  const queryWords = removeInvalidInitialOrFinalCharaters(query)
    .trim()
    .split(/\s+/);
  const lastWord = removeAccentAndSpecialCharacters(
    queryWords[queryWords.length - 1],
  );
  const queryBeginning = removeAccentAndSpecialCharacters(
    queryWords.length === 1
      ? queryWords.join(" ")
      : queryWords.slice(0, queryWords.length - 1).join(" "),
  );

  return [queryBeginning, lastWord];
};

const removeAccentAndSpecialCharacters = (str: string) =>
  removeDiacritics(str).replace(/[():]/g, "").replace(/[\&]/g, " ").trim();

const removeInvalidInitialCharacters = (str: string): string => {
  const firstCharacter = str.charAt(0);
  return ["'"].includes(firstCharacter)
    ? removeInvalidInitialCharacters(str.slice(1))
    : str;
};

const removeInvalidFinalCharacters = (str: string): string => {
  const lastCharacter = str.charAt(str.length - 1);
  return ["'"].includes(lastCharacter)
    ? removeInvalidFinalCharacters(str.slice(0, str.length - 1))
    : str;
};

const removeInvalidInitialOrFinalCharaters = (str: string): string =>
  removeInvalidInitialCharacters(removeInvalidFinalCharacters(str.trim()));
