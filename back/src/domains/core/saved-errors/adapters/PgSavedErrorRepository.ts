import { isAxiosError } from "axios";
import { sql } from "kysely";
import { ConventionId, errors } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import {
  SavedError,
  SavedErrorRepository,
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
      .where("handled_by_agency", "=", false)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0)
      throw errors.broadcastFeedback.notFound({
        conventionId,
      });
  }

  public async save(savedError: SavedError): Promise<void> {
    const {
      serviceName,
      subscriberErrorFeedback,
      params,
      occurredAt,
      handledByAgency,
      consumerName,
      consumerId,
    } = savedError;

    await this.transaction
      .insertInto("saved_errors")
      .values({
        service_name: serviceName,
        consumer_name: consumerName,
        consumer_id: consumerId,
        subscriber_error_feedback: JSON.stringify({
          message: subscriberErrorFeedback.message,
          ...(subscriberErrorFeedback.error
            ? {
                error: isAxiosError(subscriberErrorFeedback.error)
                  ? subscriberErrorFeedback.error.toJSON()
                  : // Why?  >> https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
                    JSON.stringify(
                      subscriberErrorFeedback.error,
                      Object.getOwnPropertyNames(subscriberErrorFeedback.error),
                    ),
              }
            : {}),
        }),
        params: params ?? null,
        occurred_at: occurredAt,
        handled_by_agency: handledByAgency,
      })
      .execute();
  }
}
