import { PoolClient } from "pg";
import {
  ErrorRepository,
  SavedError,
} from "../../../domain/core/ports/ErrorRepository";

export class PgErrorRepository implements ErrorRepository {
  constructor(private client: PoolClient) {}
  public async save(savedError: SavedError): Promise<void> {
    // prettier-ignore
    const { serviceName, httpStatus, message, params, occurredAt } = savedError;
    // prettier-ignore
    await this.client.query(
      `INSERT INTO saved_errors (
            service_name, http_status, message, params, occurred_at
        ) VALUES ($1, $2, $3, $4, $5)`,
      [serviceName, httpStatus, message, params, occurredAt],
    )
  }
}
