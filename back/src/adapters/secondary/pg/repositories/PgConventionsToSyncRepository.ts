import { ConventionId } from "shared";
import {
  ConventionsToSyncRepository,
  ConventionToSync,
} from "../../../../domain/convention/ports/ConventionsToSyncRepository";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

export const conventionsToSyncTableName = "conventions_to_sync_with_pe";

export class PgConventionsToSyncRepository
  implements ConventionsToSyncRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getById(
    id: ConventionId,
  ): Promise<ConventionToSync | undefined> {
    const pgConventionToSync = await selectConventionToSyncById(
      this.transaction,
      id,
    );
    return pgConventionToSync
      ? pgResultToConventionToSync(pgConventionToSync)
      : undefined;
  }

  public async getToProcessOrError(limit: number): Promise<ConventionToSync[]> {
    const queryResult = await executeKyselyRawSqlQuery<PgConventionToSync>(
      this.transaction,
      `
          SELECT id, status, process_date, reason
          FROM ${conventionsToSyncTableName}
          WHERE status = 'TO_PROCESS'
             OR status = 'ERROR'
              LIMIT $1
      `,
      [limit],
    );
    return queryResult.rows.map((pgConventionToSync) =>
      pgResultToConventionToSync(pgConventionToSync),
    );
  }

  public async save(conventionToSync: ConventionToSync): Promise<void> {
    return (await isConventionToSyncAlreadyExists(
      this.transaction,
      conventionToSync.id,
    ))
      ? updateConventionToSync(this.transaction, conventionToSync)
      : insertConventionToSync(this.transaction, conventionToSync);
  }
}

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
  } as ConventionToSync);

const isConventionToSyncAlreadyExists = async (
  transaction: KyselyDb,
  conventionId: ConventionId,
): Promise<boolean> => {
  const rows = (
    await executeKyselyRawSqlQuery(
      transaction,
      `SELECT EXISTS(SELECT 1
                     FROM ${conventionsToSyncTableName}
                     WHERE id = $1)`,
      [conventionId],
    )
  ).rows;
  const result = rows.at(0);
  if (!result) return false;
  return result.exists;
};

const updateConventionToSync = async (
  transaction: KyselyDb,
  conventionToSync: ConventionToSync,
): Promise<void> => {
  await executeKyselyRawSqlQuery(
    transaction,
    `
        UPDATE ${conventionsToSyncTableName}
        SET status       = $2,
            process_date = $3,
            reason       = $4
        WHERE id = $1
    `,
    [
      conventionToSync.id,
      conventionToSync.status,
      conventionToSync.status !== "TO_PROCESS"
        ? conventionToSync.processDate
        : null,
      conventionToSync.status === "ERROR" || conventionToSync.status === "SKIP"
        ? conventionToSync.reason
        : null,
    ],
  );
};

const insertConventionToSync = async (
  transaction: KyselyDb,
  conventionToSync: ConventionToSync,
): Promise<void> => {
  await executeKyselyRawSqlQuery(
    transaction,
    `
        INSERT INTO ${conventionsToSyncTableName} (id,
                                                   status,
                                                   process_date,
                                                   reason)
        VALUES ($1, $2, $3, $4)
    `,
    [
      conventionToSync.id,
      conventionToSync.status,
      conventionToSync.status !== "TO_PROCESS"
        ? conventionToSync.processDate
        : null,
      conventionToSync.status === "ERROR" || conventionToSync.status === "SKIP"
        ? conventionToSync.reason
        : null,
    ],
  );
};

const selectConventionToSyncById = async (
  transaction: KyselyDb,
  conventionId: ConventionId,
): Promise<PgConventionToSync | undefined> =>
  (
    await executeKyselyRawSqlQuery<PgConventionToSync>(
      transaction,
      `
          SELECT id, status, process_date, reason
          FROM ${conventionsToSyncTableName}
          WHERE id = $1
      `,
      [conventionId],
    )
  ).rows.at(0);
