import { ConventionId } from "shared";
import {
  broadcastToPeServiceName,
  ErrorRepository,
  SavedError,
} from "../../../../domain/core/ports/ErrorRepository";
import { NotFoundError } from "../../../primary/helpers/httpErrors";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

export class PgErrorRepository implements ErrorRepository {
  constructor(private transaction: KyselyDb) {}

  public async markPartnersErroredConventionAsHandled(
    conventionId: ConventionId,
  ): Promise<void> {
    const query = `UPDATE saved_errors SET
    handled_by_agency = true
    WHERE(params ->> 'conventionId') = $1
    AND service_name = $2`;
    const result = await executeKyselyRawSqlQuery(this.transaction, query, [
      conventionId,
      broadcastToPeServiceName,
    ]);

    if (Number(result.numAffectedRows) === 0)
      throw new NotFoundError(
        `There's no ${broadcastToPeServiceName} errors for convention id '${conventionId}'.`,
      );
  }

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
