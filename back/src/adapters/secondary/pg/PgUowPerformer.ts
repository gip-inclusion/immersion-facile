import { Kysely, PostgresDialect, Transaction } from "kysely";
import { Pool, PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";
import { ImmersionDatabase } from "./sql/database";

const logger = createLogger(__filename);

export class PgUowPerformer implements UnitOfWorkPerformer {
  constructor(
    private pool: Pool,
    private createPgUow: (
      client: PoolClient,
      transaction: Transaction<ImmersionDatabase>,
    ) => UnitOfWork,
  ) {}

  public async perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    const kyselyInstance = new Kysely<ImmersionDatabase>({
      dialect: new PostgresDialect({ pool: this.pool }),
    });
    return kyselyInstance.transaction().execute<T>(async (transaction) => {
      const client = await this.pool.connect();
      const uow = this.createPgUow(client, transaction);
      try {
        await client.query("BEGIN");
        const result = await cb(uow);
        await client.query("COMMIT");
        return result;
      } catch (error: any) {
        error instanceof Error
          ? logger.error({ error }, `Error in transaction: ${error.message}`)
          : logger.error(
              { unknownError: JSON.stringify(error) },
              `Unknown Error in transaction`,
            );

        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    });
  }
}
