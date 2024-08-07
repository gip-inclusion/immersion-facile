import { isAxiosError } from "axios";
import { sql } from "kysely";
import { ConventionId, errors } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import {
  BroadcastFeedback,
  BroadcastFeedbacksRepository,
} from "../ports/BroadcastFeedbacksRepository";

export class PgBroadcastFeedbacksRepository
  implements BroadcastFeedbacksRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getLastBroadcastFeedback(
    id: ConventionId,
  ): Promise<BroadcastFeedback | null> {
    const result = await this.transaction
      .with("latest_feedback", (qb) =>
        qb
          .selectFrom("broadcast_feedbacks as bf")
          .where(sql`bf.request_params ->> 'conventionId'`, "=", id)
          .select([
            "bf.consumer_id as consumerId",
            "bf.consumer_name as consumerName",
            "bf.service_name as serviceName",
            "bf.subscriber_error_feedback as subscriberErrorFeedback",
            "bf.request_params as requestParams",
            "bf.occurred_at as occurredAt",
            "bf.handled_by_agency as handledByAgency",
            "bf.response as response",
            sql<number>`
              ROW_NUMBER() OVER (
                PARTITION BY (bf.request_params->>'conventionId')
                ORDER BY bf.occurred_at DESC
              )
            `.as("rn"),
          ]),
      )
      .selectFrom("latest_feedback as lf")
      .selectAll()
      .where("lf.rn", "=", 1)
      .executeTakeFirst();

    if (!result) return null;

    return {
      consumerId: result.consumerId,
      consumerName: result.consumerName,
      handledByAgency: result.handledByAgency,
      occurredAt: result.occurredAt,
      requestParams: result.requestParams,
      serviceName: result.serviceName,
      response: result.response,
      subscriberErrorFeedback: result.subscriberErrorFeedback
        ? result.subscriberErrorFeedback
        : undefined,
    };
  }

  public async markPartnersErroredConventionAsHandled(
    conventionId: ConventionId,
  ): Promise<void> {
    const result = await this.transaction
      .updateTable("broadcast_feedbacks")
      .set({ handled_by_agency: true })
      .where(sql`(request_params ->> 'conventionId')`, "=", conventionId)
      .where("handled_by_agency", "=", false)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0)
      throw errors.broadcastFeedback.notFound({
        conventionId,
      });
  }

  public async save(broadcastFeedback: BroadcastFeedback): Promise<void> {
    const {
      serviceName,
      subscriberErrorFeedback,
      requestParams,
      response,
      occurredAt,
      handledByAgency,
      consumerName,
      consumerId,
    } = broadcastFeedback;

    await this.transaction
      .insertInto("broadcast_feedbacks")
      .values({
        service_name: serviceName,
        consumer_name: consumerName,
        consumer_id: consumerId,
        ...(subscriberErrorFeedback
          ? {
              subscriber_error_feedback: JSON.stringify({
                message: subscriberErrorFeedback.message,
                ...(subscriberErrorFeedback.error
                  ? {
                      error: isAxiosError(subscriberErrorFeedback.error)
                        ? subscriberErrorFeedback.error.toJSON()
                        : // Why?  >> https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
                          JSON.stringify(
                            subscriberErrorFeedback.error,
                            Object.getOwnPropertyNames(
                              subscriberErrorFeedback.error,
                            ),
                          ),
                    }
                  : {}),
              }),
            }
          : {}),
        request_params: JSON.stringify(requestParams),
        response: JSON.stringify(response),
        occurred_at: occurredAt,
        handled_by_agency: handledByAgency,
      })
      .execute();
  }
}
