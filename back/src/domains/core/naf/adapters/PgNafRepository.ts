import { NafSectionSuggestion } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { NafRepository } from "../port/NafRepository";

export class PgNafRepository implements NafRepository {
  constructor(private transaction: KyselyDb) {}

  async getNafSuggestions(searchText: string): Promise<NafSectionSuggestion[]> {
    const results = await this.transaction
      .selectFrom("public_naf_rev2_sections as sections")
      .leftJoin(
        "public_naf_rev2_niveaux as niveaux",
        "niveaux.code_section",
        "sections.code",
      )
      .leftJoin(
        "public_naf_rev2_sous_classes as sous_classes",
        "niveaux.code_sous_classe",
        "sous_classes.code",
      )
      .where("sections.libelle", "ilike", `%${searchText}%`)
      .select((qb) => [
        "sections.libelle",
        qb.fn
          .agg<string[]>("array_agg", ["sous_classes.naf_code"])
          .as("naf_codes"),
      ])
      .groupBy("sections.libelle")
      .orderBy("sections.libelle")
      .execute();

    return results.map((result) => ({
      label: result.libelle,
      nafCodes: result.naf_codes.sort(),
    }));
  }
}
