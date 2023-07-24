import { Transaction } from "kysely";
import { Pool } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";
import { ImmersionDatabase, makeKyselyDb } from "./sql/database";

const logger = createLogger(__filename);

export class PgUowPerformer implements UnitOfWorkPerformer {
  constructor(
    private pool: Pool,
    private createPgUow: (
      transaction: Transaction<ImmersionDatabase>,
    ) => UnitOfWork,
  ) {}

  public async perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return makeKyselyDb(this.pool)
      .transaction()
      .execute<T>((transaction) => cb(this.createPgUow(transaction)))
      .catch((error: any) => {
        error instanceof Error
          ? logger.error({ error }, `Error in transaction: ${error.message}`)
          : logger.error(
              { unknownError: JSON.stringify(error) },
              `Unknown Error in transaction`,
            );
        throw error;
      });
  }
}
