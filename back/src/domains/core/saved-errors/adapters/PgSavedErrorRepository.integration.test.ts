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

const makeSavedError = (
  serviceName: string,
  conventionId: ConventionId,
  handledByAgency?: boolean,
): SavedError => ({
  serviceName,
  message: "Some message",
  params: { conventionId, httpStatus: 500 },
  occurredAt: new Date(),
  handledByAgency: handledByAgency ? handledByAgency : false,
});

describe("PgErrorRepository", () => {
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

  it("saves an error in the repository", async () => {
    const conventionId = "someId";
    const savedError = makeSavedError("osef", conventionId);
    await pgErrorRepository.save(savedError);

    const response = await kyselyDb
      .selectFrom("saved_errors")
      .selectAll()
      .execute();

    expectObjectInArrayToMatch(response, [
      {
        handled_by_agency: savedError.handledByAgency,
        message: savedError.message,
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
      const savedError1 = makeSavedError(
        broadcastToPeServiceName,
        conventionId1,
      );
      const savedError2 = makeSavedError(
        broadcastToPeServiceName,
        conventionId1,
      );
      const savedError3 = makeSavedError("osef", conventionId1);
      const savedError4 = makeSavedError(
        broadcastToPeServiceName,
        conventionId2,
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
          (pgSavedError) =>
            ({
              serviceName: pgSavedError.service_name,
              message: pgSavedError.message,
              params: pgSavedError.params ?? undefined,
              occurredAt: pgSavedError.occurred_at,
              handledByAgency: pgSavedError.handled_by_agency,
            }) satisfies SavedError,
        ),
        [
          { ...savedError1, handledByAgency: true },
          { ...savedError2, handledByAgency: true },
          savedError3,
          savedError4,
        ],
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
      const savedError1 = makeSavedError(
        broadcastToPeServiceName,
        conventionId1,
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
