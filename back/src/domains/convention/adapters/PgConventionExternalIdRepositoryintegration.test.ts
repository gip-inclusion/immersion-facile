import { Pool, PoolClient } from "pg";
import { AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { v4 as uuid } from "uuid";
import {
  executeKyselyRawSqlQuery,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgConventionExternalIdRepository } from "./PgConventionExternalIdRepository";
import { PgConventionRepository } from "./PgConventionRepository";

describe("PgConventionExternalIdRepository", () => {
  let pgConventionExternalIdRepository: PgConventionExternalIdRepository;
  let pgConventionRepository: PgConventionRepository;
  let pgAgencyRepository: PgAgencyRepository;
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
    const transaction = makeKyselyDb(pool);
    pgConventionRepository = new PgConventionRepository(transaction);
    pgConventionExternalIdRepository = new PgConventionExternalIdRepository(
      transaction,
    );
    pgAgencyRepository = new PgAgencyRepository(transaction);
    await executeKyselyRawSqlQuery(
      transaction,
      "DELETE FROM convention_external_ids",
    );
    await executeKyselyRawSqlQuery(transaction, "DELETE FROM conventions");
    await executeKyselyRawSqlQuery(
      transaction,
      "DELETE FROM agency_groups__agencies",
    );
    await executeKyselyRawSqlQuery(transaction, "DELETE FROM agencies");
  });

  describe("save", () => {
    it("saves a conventionId and creates a corresponding conventionExternalId, then gets it by id", async () => {
      const convention = new ConventionDtoBuilder().withId(uuid()).build();
      await pgAgencyRepository.insert(
        new AgencyDtoBuilder().withId(convention.agencyId).build(),
      );
      await pgConventionRepository.save(convention);

      expect(
        await pgConventionExternalIdRepository.getByConventionId(convention.id),
      ).toBeUndefined();

      await pgConventionExternalIdRepository.save(convention.id);
      const externalId =
        await pgConventionExternalIdRepository.getByConventionId(convention.id);

      expect(typeof externalId).toBe("string");
    });
  });
});
