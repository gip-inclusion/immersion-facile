import { Kysely } from "kysely";
import { ConventionId } from "shared";
import {
  ConventionsToSyncRepository,
  ConventionToSync,
} from "../../../domain/convention/ports/ConventionsToSyncRepository";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";

export const conventionsToSyncTableName = "conventions_to_sync_with_pe";

export class PgConventionsToSyncRepository
  implements ConventionsToSyncRepository
{
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  async getById(id: ConventionId): Promise<ConventionToSync | undefined> {
    const pgConventionToSync = await selectConventionToSyncById(
      this.transaction,
      id,
    );
    return pgConventionToSync
      ? pgResultToConventionToSync(pgConventionToSync)
      : undefined;
  }

  async getToProcessOrError(limit: number): Promise<ConventionToSync[]> {
    const query = `
          SELECT id, status, process_date, reason
          FROM ${conventionsToSyncTableName}
          WHERE status = 'TO_PROCESS'
             OR status = 'ERROR'
              LIMIT $1
      `;

    const queryResult = await executeKyselyRawSqlQuery<PgConventionToSync>(
      this.transaction,
      query,
      [limit],
    );
    return queryResult.rows.map(pgResultToConventionToSync);
  }

  async save(conventionToSync: ConventionToSync): Promise<void> {
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
  transaction: Kysely<ImmersionDatabase>,
  conventionId: ConventionId,
): Promise<boolean> =>
  (
    await executeKyselyRawSqlQuery<any>(
      transaction,
      `SELECT EXISTS(SELECT 1
                     FROM ${conventionsToSyncTableName}
                     WHERE id = $1)`,
      [conventionId],
    )
  ).rows.at(0).exists;

const updateConventionToSync = async (
  transaction: Kysely<ImmersionDatabase>,
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
  transaction: Kysely<ImmersionDatabase>,
  conventionToSync: ConventionToSync,
): Promise<void> => {
  await executeKyselyRawSqlQuery(
    transaction,
    `
      INSERT INTO ${conventionsToSyncTableName} 
      (id, status, process_date, reason)
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
  transaction: Kysely<ImmersionDatabase>,
  conventionId: ConventionId,
): Promise<PgConventionToSync | undefined> =>
  (
    await executeKyselyRawSqlQuery<any>(
      transaction,
      `
          SELECT id, status, process_date, reason
          FROM ${conventionsToSyncTableName}
          WHERE id = $1
      `,
      [conventionId],
    )
  ).rows.at(0);
