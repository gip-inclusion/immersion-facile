import { ConventionExternalId, ConventionId } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { ConventionExternalIdRepository } from "../ports/ConventionExternalIdRepository";

export class PgConventionExternalIdRepository
  implements ConventionExternalIdRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionExternalId | undefined> {
    const result = await this.transaction
      .selectFrom("convention_external_ids")
      .select("external_id")
      .where("convention_id", "=", conventionId)
      .executeTakeFirst();

    return result?.external_id.toString().padStart(11, "0");
  }

  public async save(conventionId: ConventionId): Promise<void> {
    await this.transaction
      .insertInto("convention_external_ids")
      .values({ convention_id: conventionId })
      .execute();
  }
}
