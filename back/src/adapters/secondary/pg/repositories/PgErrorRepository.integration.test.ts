import { Pool, PoolClient } from "pg";
import {
  ConventionId,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { getTestPgPool } from "../../../../_testBuilders/getTestPgPool";
import {
  broadcastToPeServiceName,
  SavedError,
} from "../../../../domain/core/ports/ErrorRepository";
import { NotFoundError } from "../../../primary/helpers/httpErrors";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { PgErrorRepository } from "./PgErrorRepository";

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
  let client: PoolClient;
  let pgErrorRepository: PgErrorRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    pgErrorRepository = new PgErrorRepository(makeKyselyDb(pool));
    await client.query("DELETE FROM saved_errors");
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("saves an error in the repository", async () => {
    const savedError = makeSavedError("osef", "someId");
    await pgErrorRepository.save(savedError);
    const response = await client.query("SELECT * FROM saved_errors");
    expect(response.rows).toHaveLength(1);
    expect(response.rows[0].service_name).toBe(savedError.serviceName);
    expect(response.rows[0].params).toEqual(savedError.params);
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

      const response = await client.query<{
        service_name: string;
        message: string;
        params: Record<string, unknown>;
        occurred_at: Date;
        handled_by_agency: boolean;
      }>("SELECT * FROM saved_errors ORDER BY id");

      expectToEqual(
        response.rows.map(
          (row) =>
            ({
              serviceName: row.service_name,
              message: row.message,
              params: row.params,
              occurredAt: row.occurred_at,
              handledByAgency: row.handled_by_agency,
            } satisfies SavedError),
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
