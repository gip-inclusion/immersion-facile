import { castError } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../../utils/logger";
import { UnitOfWork } from "../ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

export class PgUowPerformer implements UnitOfWorkPerformer {
  constructor(
    private db: KyselyDb,
    private createPgUow: (transaction: KyselyDb) => UnitOfWork,
  ) {}

  public perform<T>(cb: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return this.db
      .transaction()
      .execute<T>((transaction) => cb(this.createPgUow(transaction)))
      .catch((error: any) => {
        logger.error(
          error instanceof Error
            ? {
                error,
                message: `Error in transaction: ${error.message}`,
              }
            : {
                error: castError(error),
                message: "Unknown Error in transaction",
              },
        );
        throw error;
      });
  }
}
