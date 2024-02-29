import { sql } from "kysely";
import { ConventionId } from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { KyselyDb } from "../../../../adapters/secondary/pg/kysely/kyselyUtils";
import {
  SavedError,
  SavedErrorRepository,
  broadcastToPeServiceName,
} from "../ports/SavedErrorRepository";

export class PgSavedErrorRepository implements SavedErrorRepository {
  constructor(private transaction: KyselyDb) {}

  public async markPartnersErroredConventionAsHandled(
    conventionId: ConventionId,
  ): Promise<void> {
    const result = await this.transaction
      .updateTable("saved_errors")
      .set({ handled_by_agency: true })
      .where(sql`(params ->> 'conventionId')`, "=", conventionId)
      .where("service_name", "=", broadcastToPeServiceName)
      .where("handled_by_agency", "=", false)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0)
      throw new NotFoundError(
        `There's no ${broadcastToPeServiceName} unhandled errors for convention id '${conventionId}'.`,
      );
  }

  public async save(savedError: SavedError): Promise<void> {
    const { serviceName, message, params, occurredAt, handledByAgency } =
      savedError;

    await this.transaction
      .insertInto("saved_errors")
      .values({
        service_name: serviceName,
        message,
        params: params ?? null,
        occurred_at: occurredAt,
        handled_by_agency: handledByAgency,
      })
      .execute();
  }
}