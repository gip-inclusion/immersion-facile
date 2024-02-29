import { Kysely } from "kysely";
import { Pool } from "pg";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../adapters/secondary/pg/kysely/kyselyUtils";
import { Database } from "../../../../adapters/secondary/pg/kysely/model/database";
import { createLogger } from "../../../../utils/logger";
import { UnitOfWork } from "../ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";

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