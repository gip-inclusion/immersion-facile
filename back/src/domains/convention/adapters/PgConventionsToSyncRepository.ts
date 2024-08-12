import { ConventionId } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import {
  ConventionToSync,
  ConventionsToSyncRepository,
} from "../ports/ConventionsToSyncRepository";

type PgConventionToSync = {
  id: string;
  status: string;
  process_date: Date | null;
  reason: string | null;
};

const pgResultToConventionToSync = (
  pgConventionToSync: PgConventionToSync,
): ConventionToSync =>
  ({
    id: pgConventionToSync.id,
    status: pgConventionToSync.status,
    processDate: pgConventionToSync.process_date ?? undefined,
    reason: pgConventionToSync.reason ?? undefined,
  }) as ConventionToSync;

export class PgConventionsToSyncRepository
  implements ConventionsToSyncRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getById(
    id: ConventionId,
  ): Promise<ConventionToSync | undefined> {
    const result = await this.transaction
      .selectFrom("conventions_to_sync_with_pe")
      .where("id", "=", id)
      .select(["id", "status", "process_date", "reason"])
      .executeTakeFirst();

    return result && pgResultToConventionToSync(result);
  }

  public async getToProcessOrError(limit: number): Promise<ConventionToSync[]> {
    const result = await this.transaction
      .selectFrom("conventions_to_sync_with_pe")
      .where("status", "in", ["TO_PROCESS", "ERROR"])
      .select(["id", "status", "process_date", "reason"])
      .limit(limit)
      .execute();

    return result.map((pgConventionToSync) =>
      pgResultToConventionToSync(pgConventionToSync),
    );
  }

  public async save(conventionToSync: ConventionToSync): Promise<void> {
    return (await this.#isConventionToSyncAlreadyExists(conventionToSync.id))
      ? this.#updateConventionToSync(conventionToSync)
      : this.#insertConventionToSync(conventionToSync);
  }

  async #isConventionToSyncAlreadyExists(
    conventionId: ConventionId,
  ): Promise<boolean> {
    const result = await this.transaction
      .selectNoFrom(({ exists, selectFrom }) =>
        exists(
          selectFrom("conventions_to_sync_with_pe")
            .where("id", "=", conventionId)
            .select("id"),
        ).as("exist"),
      )
      .executeTakeFirst();

    return result !== undefined ? Boolean(result.exist) : false;
  }

  async #updateConventionToSync(
    conventionToSync: ConventionToSync,
  ): Promise<void> {
    await this.transaction
      .updateTable("conventions_to_sync_with_pe")
      .set({
        status: conventionToSync.status,
        process_date:
          conventionToSync.status !== "TO_PROCESS"
            ? conventionToSync.processDate
            : null,
        reason:
          conventionToSync.status === "ERROR" ||
          conventionToSync.status === "SKIP"
            ? conventionToSync.reason
            : null,
      })
      .where("id", "=", conventionToSync.id)
      .execute();
  }

  async #insertConventionToSync(
    conventionToSync: ConventionToSync,
  ): Promise<void> {
    await this.transaction
      .insertInto("conventions_to_sync_with_pe")
      .values({
        id: conventionToSync.id,
        status: conventionToSync.status,
        process_date:
          conventionToSync.status !== "TO_PROCESS"
            ? conventionToSync.processDate
            : null,
        reason:
          conventionToSync.status === "ERROR" ||
          conventionToSync.status === "SKIP"
            ? conventionToSync.reason
            : null,
      })
      .execute();
  }
}
