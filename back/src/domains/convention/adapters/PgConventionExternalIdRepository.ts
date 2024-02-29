import { ConventionExternalId, ConventionId } from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../config/pg/kysely/kyselyUtils";
import { ConventionExternalIdRepository } from "../ports/ConventionExternalIdRepository";

export class PgConventionExternalIdRepository
  implements ConventionExternalIdRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionExternalId | undefined> {
    const results = await executeKyselyRawSqlQuery(
      this.transaction,
      "SELECT external_id FROM convention_external_ids WHERE convention_id = $1 LIMIT 1",
      [conventionId],
    );
    const externalIdAsNumber = results.rows[0]?.external_id as
      | number
      | undefined;

    return externalIdAsNumber?.toString().padStart(11, "0");
  }

  public async save(conventionId: ConventionId): Promise<void> {
    await executeKyselyRawSqlQuery(
      this.transaction,
      "INSERT INTO convention_external_ids(convention_id) VALUES($1)",
      [conventionId],
    );
  }
}
