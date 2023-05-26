import { Pool, PoolClient } from "pg";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { SavedError } from "../../../domain/core/ports/ErrorRepository";
import { PgErrorRepository } from "./PgErrorRepository";

const savedError: SavedError = {
  serviceName: "SomeService",
  message: "Some message",
  params: { someId: "123", httpStatus: 500 },
  occurredAt: new Date("2021-01-01"),
};
describe("PgEstablishmentGroupRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgErrorRepository: PgErrorRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    pgErrorRepository = new PgErrorRepository(client);
    await client.query("DELETE FROM saved_errors");
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("saves an error in the repository", async () => {
    await pgErrorRepository.save(savedError);
    const response = await client.query("SELECT * FROM saved_errors");
    expect(response.rows).toHaveLength(1);
    expect(response.rows[0].service_name).toBe(savedError.serviceName);
    expect(response.rows[0].params).toEqual(savedError.params);
  });
});
