import { Pool, PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";

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
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
