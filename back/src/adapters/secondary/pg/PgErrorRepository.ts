import { Kysely } from "kysely";
import {
  ErrorRepository,
  SavedError,
} from "../../../domain/core/ports/ErrorRepository";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";

export class PgErrorRepository implements ErrorRepository {
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  public async save({
    message,
    occurredAt,
    params,
    serviceName,
  }: SavedError): Promise<void> {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `INSERT INTO saved_errors (
            service_name, message, params, occurred_at
        ) VALUES ($1, $2, $3, $4)`,
      [serviceName, message, params, occurredAt],
    );
  }
}
