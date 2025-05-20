import axios, { isAxiosError } from "axios";
import type { Pool } from "pg";
import {
  type ConventionId,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  type KyselyDb,
  cast,
  jsonBuildObject,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import type { SubscriberErrorFeedback } from "../../api-consumer/ports/SubscribersGateway";
import {
  type BroadcastFeedback,
  type BroadcastFeedbackResponse,
  type ConventionBroadcastRequestParams,
  broadcastToFtLegacyServiceName,
} from "../ports/BroadcastFeedbacksRepository";
import { PgBroadcastFeedbacksRepository } from "./PgBroadcastFeedbacksRepository";

describe("PgBroadcastFeedbacksRepository", () => {
  let pool: Pool;
  let pgBroadcastFeedbacksRepository: PgBroadcastFeedbacksRepository;
  let kyselyDb: KyselyDb;

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
    const broadcastFeedback = await makeBroadcastFeedback({
      conventionId,
      serviceName: "osef",
      kind: "error",
      errorMode: "response-error",
    });
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
    const broadcastFeedback = await makeBroadcastFeedback({
      conventionId,
      serviceName: "osef",
      kind: "success",
    });
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
    const broadcastFeedback = await makeBroadcastFeedback({
      conventionId,
      serviceName: "osef",
      kind: "error",
      errorMode: "timeout",
    });
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
    const broadcastFeedback = await makeBroadcastFeedback({
      conventionId,
      serviceName: "osef",
      kind: "error",
      errorMode: "not-axios-error",
    });
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
      const broadcastFeedback1 = await makeBroadcastFeedback({
        conventionId: conventionId1,
        serviceName: broadcastToFtLegacyServiceName,
        kind: "error",
        errorMode: "response-error",
      });
      const broadcastFeedback2 = await makeBroadcastFeedback({
        conventionId: conventionId1,
        serviceName: broadcastToFtLegacyServiceName,
        kind: "error",
        errorMode: "response-error",
      });
      const broadcastFeedback3 = await makeBroadcastFeedback({
        conventionId: conventionId1,
        serviceName: "osef",
        kind: "error",
        errorMode: "response-error",
      });
      const broadcastFeedback4 = await makeBroadcastFeedback({
        conventionId: conventionId2,
        serviceName: broadcastToFtLegacyServiceName,
        kind: "error",
        errorMode: "response-error",
      });

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
      const broadcastFeedback1 = await makeBroadcastFeedback({
        conventionId: conventionId1,
        serviceName: broadcastToFtLegacyServiceName,
        kind: "error",
        errorMode: "response-error",
        handledByAgency: true,
      });
      await pgBroadcastFeedbacksRepository.save(broadcastFeedback1);

      await expectPromiseToFailWithError(
        pgBroadcastFeedbacksRepository.markPartnersErroredConventionAsHandled(
          conventionId1,
        ),
        errors.broadcastFeedback.notFound({ conventionId: conventionId1 }),
      );
    });
  });

  describe("getLastBroadcastFeedback", () => {
    it("retrieve nothing if there is not last broadcast feedback", async () => {
      const conventionId = "d07af28e-9c7b-4845-91ee-71020860faa8";

      const result =
        await pgBroadcastFeedbacksRepository.getLastBroadcastFeedback(
          conventionId,
        );

      expect(result).toBeNull();
    });

    it("retrieve a broadcast feedback", async () => {
      const conventionId = "d07af28e-9c7b-4845-91ee-71020860faa8";

      const firstBroadcast = await makeBroadcastFeedback({
        conventionId,
        serviceName: broadcastToFtLegacyServiceName,
        kind: "error",
        occurredAt: new Date("2024-07-01"),
      });
      const lastBroadcast = await makeBroadcastFeedback({
        conventionId,
        serviceName: broadcastToFtLegacyServiceName,
        kind: "error",
        occurredAt: new Date("2024-07-31"),
      });
      await pgBroadcastFeedbacksRepository.save(firstBroadcast);
      await pgBroadcastFeedbacksRepository.save(lastBroadcast);

      const result =
        await pgBroadcastFeedbacksRepository.getLastBroadcastFeedback(
          conventionId,
        );

      expectToEqual(result, {
        ...lastBroadcast,
        ...(result?.subscriberErrorFeedback
          ? {
              subscriberErrorFeedback: {
                message: result.subscriberErrorFeedback.message,
                error: JSON.parse(
                  JSON.stringify(result.subscriberErrorFeedback.error),
                ),
              },
            }
          : {}),
      });
    });
  });
});

const makeBroadcastFeedback = async (params: {
  kind: "error" | "success";
  serviceName: string;
  conventionId: ConventionId;
  occurredAt?: Date;
  errorMode?: "timeout" | "response-error" | "not-axios-error";
  handledByAgency?: boolean;
}): Promise<BroadcastFeedback> => {
  if (params.kind === "error") {
    const error = await axios
      .get(
        params.errorMode === "timeout"
          ? "http://sdlmfhjsdflmsdhfmsldjfhsd.com"
          : "https://www.google.com/yolo?hl=fr&tab=ww",
      )
      .then(() => {
        throw errors.generic.testError("Should not occurs");
      })
      .catch((error) => {
        if (isAxiosError(error)) return error;
        throw error;
      });

    return {
      consumerId: null,
      consumerName: "my-consumer",
      serviceName: params.serviceName,
      subscriberErrorFeedback: {
        message: "Some message",
        error:
          params.errorMode === "not-axios-error"
            ? errors.generic.testError("Not axios error")
            : error,
      },
      requestParams: { conventionId: params.conventionId },
      response: { httpStatus: 500 },
      occurredAt: params.occurredAt ? params.occurredAt : new Date(),
      handledByAgency: params.handledByAgency ? params.handledByAgency : false,
    };
  }

  return {
    consumerId: null,
    consumerName: "my-consumer",
    serviceName: params.serviceName,
    requestParams: { conventionId: params.conventionId },
    response: { httpStatus: 200, body: { status: 200, title: "blabla" } },
    occurredAt: params.occurredAt ? params.occurredAt : new Date(),
    handledByAgency: params.handledByAgency ? params.handledByAgency : false,
  };
};
