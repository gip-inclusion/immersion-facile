import { Pool, PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class PgUowPerformer implements UnitOfWorkPerformer {
  constructor(
    private pool: Pool,
    private createPgUow: (client: PoolClient) => UnitOfWork,
  ) {}

  public async perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const uow = this.createPgUow(client);

    try {
      await client.query("BEGIN");
      const result = await cb(uow);
      await client.query("COMMIT");
      return result;
    } catch (error: any) {
      if (error instanceof Error) {
        logger.error({ error }, `Error in transaction: ${error.message}`);
      } else {
        logger.error(
          { unknownError: JSON.stringify(error) },
          `Unknown Error in transaction`,
        );
      }
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
