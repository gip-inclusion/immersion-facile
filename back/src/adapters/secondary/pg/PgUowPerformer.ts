import { Kysely } from "kysely";
import { Pool } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domains/core/ports/UnitOfWork";
import { createLogger } from "../../../utils/logger";
import { KyselyDb, makeKyselyDb } from "./kysely/kyselyUtils";
import { Database } from "./kysely/model/database";

const logger = createLogger(__filename);

export class PgUowPerformer implements UnitOfWorkPerformer {
  #db: Kysely<Database>;

  constructor(
    pool: Pool,
    private createPgUow: (transaction: KyselyDb) => UnitOfWork,
  ) {
    this.#db = makeKyselyDb(pool);
  }

  public perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return this.#db
      .transaction()
      .execute<T>((transaction) => cb(this.createPgUow(transaction)))
      .catch((error: any) => {
        error instanceof Error
          ? logger.error({ error }, `Error in transaction: ${error.message}`)
          : logger.error(
              { unknownError: JSON.stringify(error) },
              "Unknown Error in transaction",
            );
        throw error;
      });
  }
}
