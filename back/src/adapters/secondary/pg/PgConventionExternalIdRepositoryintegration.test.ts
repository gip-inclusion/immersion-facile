import { Pool, PoolClient } from "pg";
import { ConventionDtoBuilder } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgConventionExternalIdRepository } from "./PgConventionExternalIdRepository";
import { PgConventionRepository } from "./PgConventionRepository";

describe("PgConventionExternalIdRepository", () => {
  let pgConventionExternalIdRepository: PgConventionExternalIdRepository;
  let pgConventionRepository: PgConventionRepository;
  let client: PoolClient;
  let pool: Pool;

  beforeAll(() => {
    pool = getTestPgPool();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    client = await pool.connect();
    pgConventionRepository = new PgConventionRepository(client);
    pgConventionExternalIdRepository = new PgConventionExternalIdRepository(
      client,
    );
    await client.query("DELETE FROM convention_external_ids");
    await client.query("DELETE FROM conventions");
  });

  describe("save", () => {
    it("saves a conventionId and creates a corresponding conventionExternalId, then gets it by id", async () => {
      const conventionId = "11111111-1111-4111-1111-111111111111";
      await pgConventionRepository.save(
        new ConventionDtoBuilder().withId(conventionId).build(),
      );

      expect(
        await pgConventionExternalIdRepository.getByConventionId(conventionId),
      ).toBeUndefined();

      await pgConventionExternalIdRepository.save(conventionId);
      const externalId =
        await pgConventionExternalIdRepository.getByConventionId(conventionId);

      expect(typeof externalId).toBe("string");
    });
  });
});
