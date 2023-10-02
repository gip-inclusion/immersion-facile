import {
  ErrorRepository,
  SavedError,
} from "../../../../domain/core/ports/ErrorRepository";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

export class PgErrorRepository implements ErrorRepository {
  constructor(private transaction: KyselyDb) {}

  public async save(savedError: SavedError): Promise<void> {
    // prettier-ignore
    const { serviceName, message, params, occurredAt } = savedError;
    // prettier-ignore
    await executeKyselyRawSqlQuery( this.transaction,
      `INSERT INTO saved_errors (
            service_name, message, params, occurred_at
        ) VALUES ($1, $2, $3, $4)`,
      [serviceName, message, params, occurredAt],
    )
  }
}
