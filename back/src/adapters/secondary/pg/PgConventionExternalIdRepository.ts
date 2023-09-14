import { PoolClient } from "pg";
import { ConventionExternalId, ConventionId } from "shared";
import { ConventionExternalIdRepository } from "../../../domain/convention/ports/ConventionExternalIdRepository";

export class PgConventionExternalIdRepository
  implements ConventionExternalIdRepository
{
  constructor(private client: PoolClient) {}

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ConventionExternalId | undefined> {
    const results = await this.client.query(
      "SELECT external_id FROM convention_external_ids WHERE convention_id = $1 LIMIT 1",
      [conventionId],
    );
    const externalIdAsNumber = results.rows[0]?.external_id as
      | number
      | undefined;

    return externalIdAsNumber?.toString().padStart(11, "0");
  }

  public async save(conventionId: ConventionId): Promise<void> {
    await this.client.query(
      "INSERT INTO convention_external_ids(convention_id) VALUES($1)",
      [conventionId],
    );
  }
}
