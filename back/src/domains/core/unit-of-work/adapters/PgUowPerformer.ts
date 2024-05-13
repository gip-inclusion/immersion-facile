import { Kysely } from "kysely";
import { Pool } from "pg";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { Database } from "../../../../config/pg/kysely/model/database";
import { createLogger } from "../../../../utils/logger";
import { UnitOfWork } from "../ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";
import { castError } from "shared";

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
          ? logger.error({
              error,
              message: `Error in transaction: ${error.message}`,
            })
          : logger.error({
              error: castError(error),
              message: "Unknown Error in transaction",
            });
        throw error;
      });
  }
}
