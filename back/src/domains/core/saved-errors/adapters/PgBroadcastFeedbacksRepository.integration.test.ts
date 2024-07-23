import axios, { isAxiosError } from "axios";
import { Kysely } from "kysely/dist/cjs/kysely";
import { Pool } from "pg";
import {
  ConventionId,
  NotFoundError,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";

import {
  cast,
  jsonBuildObject,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { Database } from "../../../../config/pg/kysely/model/database";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { SubscriberErrorFeedback } from "../../api-consumer/ports/SubscribersGateway";
import {
  BroadcastFeedback,
  BroadcastFeedbackResponse,
  ConventionBroadcastRequestParams,
  broadcastToPeServiceName,
} from "../ports/BroadcastFeedbacksRepository";
import { PgBroadcastFeedbacksRepository } from "./PgBroadcastFeedbacksRepository";

describe("PgBroadcastFeedbacksRepository", () => {
  let pool: Pool;
  let pgBroadcastFeedbacksRepository: PgBroadcastFeedbacksRepository;
  let kyselyDb: Kysely<Database>;

  beforeAll(() => {
    pool = getTestPgPool();
  });

  beforeEach(async () => {
    kyselyDb = makeKyselyDb(pool);
    pgBroadcastFeedbacksRepository = new PgBroadcastFeedbacksRepository(
      kyselyDb,
    );
    await kyselyDb.deleteFrom("broadcast_feedbacks").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves an axios response error in the repository", async () => {
    const conventionId = "someId";
    const broadcastFeedback = await makeBroadcastFeedback(
      "error",
      "osef",
      conventionId,
      "response-error",
    );
    await pgBroadcastFeedbacksRepository.save(broadcastFeedback);

    const response = await kyselyDb
      .selectFrom("broadcast_feedbacks")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: broadcastFeedback.handledByAgency,
        ...(broadcastFeedback.subscriberErrorFeedback
          ? {
              subscriber_error_feedback: {
                message: broadcastFeedback.subscriberErrorFeedback.message,
                error: JSON.parse(
                  JSON.stringify(
                    broadcastFeedback.subscriberErrorFeedback.error,
                  ),
                ),
              },
            }
          : {}),
        occurred_at: broadcastFeedback.occurredAt,
        request_params: broadcastFeedback.requestParams,
        ...(broadcastFeedback.response
          ? { response: { httpStatus: broadcastFeedback.response.httpStatus } }
          : {}),
        service_name: broadcastFeedback.serviceName,
      },
    ]);
  });

  it("saves an axios response success in the repository", async () => {
    const conventionId = "someId";
    const broadcastFeedback = await makeBroadcastFeedback(
      "success",
      "osef",
      conventionId,
    );
    await pgBroadcastFeedbacksRepository.save(broadcastFeedback);

    const response = await kyselyDb
      .selectFrom("broadcast_feedbacks")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: broadcastFeedback.handledByAgency,
        occurred_at: broadcastFeedback.occurredAt,
        request_params: broadcastFeedback.requestParams,
        ...(broadcastFeedback.response
          ? {
              response: {
                httpStatus: broadcastFeedback.response.httpStatus,
                body: JSON.parse(
                  JSON.stringify(broadcastFeedback.response.body),
                ),
              },
            }
          : {}),
        service_name: broadcastFeedback.serviceName,
      },
    ]);
  });

  it("saves an axios timeout error in the repository", async () => {
    const conventionId = "someId";
    const broadcastFeedback = await makeBroadcastFeedback(
      "error",
      "osef",
      conventionId,
      "timeout",
    );
    await pgBroadcastFeedbacksRepository.save(broadcastFeedback);

    const response = await kyselyDb
      .selectFrom("broadcast_feedbacks")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: broadcastFeedback.handledByAgency,
        ...(broadcastFeedback.subscriberErrorFeedback
          ? {
              subscriber_error_feedback: {
                message: broadcastFeedback.subscriberErrorFeedback.message,
                error: JSON.parse(
                  JSON.stringify(
                    broadcastFeedback.subscriberErrorFeedback.error,
                  ),
                ),
              },
            }
          : {}),
        occurred_at: broadcastFeedback.occurredAt,
        request_params: broadcastFeedback.requestParams,
        ...(broadcastFeedback.response
          ? {
              response: {
                httpStatus: broadcastFeedback.response.httpStatus,
              },
            }
          : {}),

        service_name: broadcastFeedback.serviceName,
      },
    ]);
  });

  it("saves a not axios error in the repository", async () => {
    const conventionId = "someId";
    const broadcastFeedback = await makeBroadcastFeedback(
      "error",
      "osef",
      conventionId,
      "not-axios-error",
    );
    await pgBroadcastFeedbacksRepository.save(broadcastFeedback);

    const response = await kyselyDb
      .selectFrom("broadcast_feedbacks")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: broadcastFeedback.handledByAgency,
        ...(broadcastFeedback.subscriberErrorFeedback
          ? {
              subscriber_error_feedback: {
                message: broadcastFeedback.subscriberErrorFeedback.message,
                error: JSON.parse(
                  JSON.stringify(
                    broadcastFeedback.subscriberErrorFeedback.error,
                  ),
                ),
              },
            }
          : {}),
        occurred_at: broadcastFeedback.occurredAt,
        request_params: broadcastFeedback.requestParams,
        ...(broadcastFeedback.response
          ? { response: { httpStatus: broadcastFeedback.response.httpStatus } }
          : {}),
        service_name: broadcastFeedback.serviceName,
      },
    ]);
  });

  describe("markPartnersErroredConventionAsHandled", () => {
    const conventionId1 = "d07af28e-9c7b-4845-91ee-71020860faa8";

    it("mark errored convention as handle when convention exist", async () => {
      const conventionId2 = "someId";
      const broadcastFeedback1 = await makeBroadcastFeedback(
        "error",
        broadcastToPeServiceName,
        conventionId1,
        "response-error",
      );
      const broadcastFeedback2 = await makeBroadcastFeedback(
        "error",
        broadcastToPeServiceName,
        conventionId1,
        "response-error",
      );
      const broadcastFeedback3 = await makeBroadcastFeedback(
        "error",
        "osef",
        conventionId1,
        "response-error",
      );
      const broadcastFeedback4 = await makeBroadcastFeedback(
        "error",
        broadcastToPeServiceName,
        conventionId2,
        "response-error",
      );

      await pgBroadcastFeedbacksRepository.save(broadcastFeedback1);
      await pgBroadcastFeedbacksRepository.save(broadcastFeedback2);
      await pgBroadcastFeedbacksRepository.save(broadcastFeedback3);
      await pgBroadcastFeedbacksRepository.save(broadcastFeedback4);

      await pgBroadcastFeedbacksRepository.markPartnersErroredConventionAsHandled(
        conventionId1,
      );

      const pgbroadcastFeedbacks = await kyselyDb
        .selectFrom("broadcast_feedbacks as bf")
        .select((qb) =>
          jsonBuildObject({
            serviceName: qb.ref("bf.service_name"),
            subscriberErrorFeedback: cast<SubscriberErrorFeedback>(
              qb.ref("bf.subscriber_error_feedback"),
            ),
            requestParams: cast<ConventionBroadcastRequestParams>(
              qb.ref("bf.request_params"),
            ),
            response: cast<BroadcastFeedbackResponse>(qb.ref("bf.response")),
            occurredAt: qb.ref("bf.occurred_at"),
            handledByAgency: qb.ref("bf.handled_by_agency"),
            consumerName: qb.ref("bf.consumer_name"),
            consumerId: qb.ref("bf.consumer_id"),
          }).as("broacastFeedback"),
        )
        .orderBy("id")
        .execute();

      expectToEqual(
        pgbroadcastFeedbacks.map(
          (pgBroadcastFeedback): BroadcastFeedback => ({
            serviceName: pgBroadcastFeedback.broacastFeedback.serviceName,
            subscriberErrorFeedback:
              pgBroadcastFeedback.broacastFeedback.subscriberErrorFeedback,
            requestParams: pgBroadcastFeedback.broacastFeedback.requestParams,
            response: pgBroadcastFeedback.broacastFeedback.response,
            occurredAt: new Date(
              pgBroadcastFeedback.broacastFeedback.occurredAt,
            ),
            handledByAgency:
              pgBroadcastFeedback.broacastFeedback.handledByAgency,
            consumerName: pgBroadcastFeedback.broacastFeedback.consumerName,
            consumerId: pgBroadcastFeedback.broacastFeedback.consumerId,
          }),
        ),
        [
          { ...broadcastFeedback1, handledByAgency: true },
          { ...broadcastFeedback2, handledByAgency: true },
          { ...broadcastFeedback3, handledByAgency: true },
          broadcastFeedback4,
        ].map(({ subscriberErrorFeedback, ...rest }) => ({
          ...rest,
          ...(subscriberErrorFeedback
            ? {
                subscriberErrorFeedback: {
                  message: subscriberErrorFeedback.message,
                  error: JSON.parse(
                    JSON.stringify(subscriberErrorFeedback.error),
                  ),
                },
              }
            : {}),
        })),
      );
    });

    it("Throw when there is no error for convention", async () => {
      await expectPromiseToFailWithError(
        pgBroadcastFeedbacksRepository.markPartnersErroredConventionAsHandled(
          conventionId1,
        ),
        errors.broadcastFeedback.notFound({
          conventionId: conventionId1,
        }),
      );
    });

    it("Throw when the saved error is already mark as handle", async () => {
      const broadcastFeedback1 = await makeBroadcastFeedback(
        "error",
        broadcastToPeServiceName,
        conventionId1,
        "response-error",
        true,
      );
      await pgBroadcastFeedbacksRepository.save(broadcastFeedback1);

      await expectPromiseToFailWithError(
        pgBroadcastFeedbacksRepository.markPartnersErroredConventionAsHandled(
          conventionId1,
        ),
        new NotFoundError(
          `There's no unhandled errors for convention id '${conventionId1}'.`,
        ),
      );
    });
  });
});

const makeBroadcastFeedback = async (
  kind: "error" | "success",
  serviceName: string,
  conventionId: ConventionId,
  errorMode?: "timeout" | "response-error" | "not-axios-error",
  handledByAgency?: boolean,
): Promise<BroadcastFeedback> => {
  if (kind === "error") {
    const error = await axios
      .get(
        errorMode === "timeout"
          ? "http://sdlmfhjsdflmsdhfmsldjfhsd.com"
          : "https://www.google.com/yolo?hl=fr&tab=ww",
      )
      .then(() => {
        throw new Error("Should not occurs");
      })
      .catch((error) => {
        if (isAxiosError(error)) return error;
        throw error;
      });

    return {
      consumerId: null,
      consumerName: "my-consumer",
      serviceName,
      subscriberErrorFeedback: {
        message: "Some message",
        error:
          errorMode === "not-axios-error"
            ? new Error("Not axios error")
            : error,
      },
      requestParams: { conventionId },
      response: { httpStatus: 500 },
      occurredAt: new Date(),
      handledByAgency: handledByAgency ? handledByAgency : false,
    };
  }

  return {
    consumerId: null,
    consumerName: "my-consumer",
    serviceName,
    requestParams: { conventionId },
    response: { httpStatus: 200, body: { status: 200, title: "blabla" } },
    occurredAt: new Date(),
    handledByAgency: handledByAgency ? handledByAgency : false,
  };
};
