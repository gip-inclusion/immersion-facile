import { Timestamp } from "aws-sdk/clients/apigateway";
import { isAxiosError } from "axios";
import { sql } from "kysely";
import { ApiConsumerId, ApiConsumerName, ConventionId, errors } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { SubscriberErrorFeedback } from "../../api-consumer/ports/SubscribersGateway";
import {
  BroadcastFeedback,
  BroadcastFeedbackResponse,
  BroadcastFeedbacksRepository,
  ConventionBroadcastRequestParams,
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
          .select((eb) => [
            eb
              .ref("bf.consumer_id")
              .$castTo<ApiConsumerId | null>()
              .as("consumerId"),
            eb
              .ref("bf.consumer_name")
              .$castTo<ApiConsumerName>()
              .as("consumerName"),
            eb.ref("bf.service_name").$castTo<string>().as("serviceName"),
            eb
              .ref("bf.subscriber_error_feedback")
              .$castTo<SubscriberErrorFeedback | null>()
              .as("subscriberErrorFeedback"),
            eb
              .ref("bf.request_params")
              .$castTo<ConventionBroadcastRequestParams>()
              .as("requestParams"),
            eb.ref("bf.occurred_at").$castTo<Timestamp>().as("occurredAt"),
            eb
              .ref("bf.handled_by_agency")
              .$castTo<boolean>()
              .as("handledByAgency"),
            eb
              .ref("bf.response")
              .$castTo<BroadcastFeedbackResponse | null>()
              .as("response"),
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
