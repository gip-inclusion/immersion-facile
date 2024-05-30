import axios, { isAxiosError } from "axios";
import { Kysely } from "kysely/dist/cjs/kysely";
import { Pool } from "pg";
import {
  ConventionId,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { NotFoundError } from "../../../../config/helpers/httpErrors";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { Database } from "../../../../config/pg/kysely/model/database";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import {
  SavedError,
  broadcastToPeServiceName,
} from "../ports/SavedErrorRepository";
import { PgSavedErrorRepository } from "./PgSavedErrorRepository";

describe("PgSavedErrorRepository", () => {
  let pool: Pool;
  let pgErrorRepository: PgSavedErrorRepository;
  let kyselyDb: Kysely<Database>;

  beforeAll(() => {
    pool = getTestPgPool();
  });

  beforeEach(async () => {
    kyselyDb = makeKyselyDb(pool);
    pgErrorRepository = new PgSavedErrorRepository(kyselyDb);
    await kyselyDb.deleteFrom("saved_errors").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves an axios response error in the repository", async () => {
    const conventionId = "someId";
    const savedError = await makeSavedError(
      "osef",
      conventionId,
      "response-error",
    );
    await pgErrorRepository.save(savedError);

    const response = await kyselyDb
      .selectFrom("saved_errors")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: savedError.handledByAgency,
        subscriber_error_feedback: {
          message: savedError.subscriberErrorFeedback.message,
          error: JSON.parse(
            JSON.stringify(savedError.subscriberErrorFeedback.error),
          ),
        },
        occurred_at: savedError.occurredAt,
        params: savedError.params,
        service_name: savedError.serviceName,
      },
    ]);
  });

  it("saves an axios timeout error in the repository", async () => {
    const conventionId = "someId";
    const savedError = await makeSavedError("osef", conventionId, "timeout");
    await pgErrorRepository.save(savedError);

    const response = await kyselyDb
      .selectFrom("saved_errors")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: savedError.handledByAgency,
        subscriber_error_feedback: {
          message: savedError.subscriberErrorFeedback.message,
          error: JSON.parse(
            JSON.stringify(savedError.subscriberErrorFeedback.error),
          ),
        },
        occurred_at: savedError.occurredAt,
        params: savedError.params,
        service_name: savedError.serviceName,
      },
    ]);
  });

  it("saves a not axios error in the repository", async () => {
    const conventionId = "someId";
    const savedError = await makeSavedError(
      "osef",
      conventionId,
      "not-axios-error",
    );
    await pgErrorRepository.save(savedError);

    const response = await kyselyDb
      .selectFrom("saved_errors")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: savedError.handledByAgency,
        subscriber_error_feedback: {
          message: savedError.subscriberErrorFeedback.message,
          error: JSON.parse(
            JSON.stringify(savedError.subscriberErrorFeedback.error),
          ),
        },
        occurred_at: savedError.occurredAt,
        params: savedError.params,
        service_name: savedError.serviceName,
      },
    ]);
  });

  describe("markPartnersErroredConventionAsHandled", () => {
    const conventionId1 = "d07af28e-9c7b-4845-91ee-71020860faa8";

    it(`mark errored convention as handle when convention exist and service name is '${broadcastToPeServiceName}'`, async () => {
      const conventionId2 = "someId";
      const savedError1 = await makeSavedError(
        broadcastToPeServiceName,
        conventionId1,
        "response-error",
      );
      const savedError2 = await makeSavedError(
        broadcastToPeServiceName,
        conventionId1,
        "response-error",
      );
      const savedError3 = await makeSavedError(
        "osef",
        conventionId1,
        "response-error",
      );
      const savedError4 = await makeSavedError(
        broadcastToPeServiceName,
        conventionId2,
        "response-error",
      );

      await pgErrorRepository.save(savedError1);
      await pgErrorRepository.save(savedError2);
      await pgErrorRepository.save(savedError3);
      await pgErrorRepository.save(savedError4);

      await pgErrorRepository.markPartnersErroredConventionAsHandled(
        conventionId1,
      );

      const pgSavedErrors = await kyselyDb
        .selectFrom("saved_errors")
        .selectAll()
        .orderBy("id")
        .execute();

      expectToEqual(
        pgSavedErrors.map(
          (pgSavedError): SavedError => ({
            serviceName: pgSavedError.service_name,
            subscriberErrorFeedback:
              pgSavedError.subscriber_error_feedback as any,
            params: pgSavedError.params ?? undefined,
            occurredAt: pgSavedError.occurred_at,
            handledByAgency: pgSavedError.handled_by_agency,
            consumerName: pgSavedError.consumer_name,
            consumerId: pgSavedError.consumer_id,
          }),
        ),
        [
          { ...savedError1, handledByAgency: true },
          { ...savedError2, handledByAgency: true },
          savedError3,
          savedError4,
        ].map(({ subscriberErrorFeedback, ...rest }) => ({
          ...rest,
          subscriberErrorFeedback: {
            message: subscriberErrorFeedback.message,
            error: JSON.parse(JSON.stringify(subscriberErrorFeedback.error)),
          },
        })),
      );
    });

    it("Throw when there is no error for convention", async () => {
      await expectPromiseToFailWithError(
        pgErrorRepository.markPartnersErroredConventionAsHandled(conventionId1),
        new NotFoundError(
          `There's no ${broadcastToPeServiceName} unhandled errors for convention id '${conventionId1}'.`,
        ),
      );
    });

    it("Throw when the saved error is already mark as handle", async () => {
      const savedError1 = await makeSavedError(
        broadcastToPeServiceName,
        conventionId1,
        "response-error",
        true,
      );
      await pgErrorRepository.save(savedError1);

      await expectPromiseToFailWithError(
        pgErrorRepository.markPartnersErroredConventionAsHandled(conventionId1),
        new NotFoundError(
          `There's no ${broadcastToPeServiceName} unhandled errors for convention id '${conventionId1}'.`,
        ),
      );
    });
  });
});

const makeSavedError = async (
  serviceName: string,
  conventionId: ConventionId,
  errorMode: "timeout" | "response-error" | "not-axios-error",
  handledByAgency?: boolean,
): Promise<SavedError> => {
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
        errorMode === "not-axios-error" ? new Error("Not axios error") : error,
    },
    params: { conventionId, httpStatus: 500 },
    occurredAt: new Date(),
    handledByAgency: handledByAgency ? handledByAgency : false,
  };
};
