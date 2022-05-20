import { Pool, PoolClient } from "pg";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
} from "../../_testBuilders/test.helpers";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { PgImmersionOutcomeRepository } from "../../adapters/secondary/pg/PgImmersionOutcomeRepository";
import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";

const conventionId = "aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa";

const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
  .withId(conventionId)
  .build();

const immersionOutcome: ImmersionOutcomeDto = {
  id: "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb",
  status: "FINISHED",
  establishmentFeedback: "Ca s'est bien passé",
  conventionId,
};

describe("PgImmersionOutcomeRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let immersionOutcomeRepository: PgImmersionOutcomeRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM immersion_outcomes");
    await client.query("DELETE FROM immersion_applications");
    await client.query("DELETE FROM agencies");
    const agencyRepository = new PgAgencyRepository(client);
    await agencyRepository.insert(AgencyConfigBuilder.create().build());
    const immersionApplicationRepository = new PgImmersionApplicationRepository(
      client,
    );
    await immersionApplicationRepository.save(immersionApplicationEntity);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_outcomes");
    immersionOutcomeRepository = new PgImmersionOutcomeRepository(client);
  });

  describe("save", () => {
    it("fails to save when it does not match an existing convention", async () => {
      await expectPromiseToFailWithError(
        immersionOutcomeRepository.save({
          ...immersionOutcome,
          conventionId: "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        }),
        new Error(
          "No convention found for id 40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        ),
      );
    });

    it("when all is good", async () => {
      await immersionOutcomeRepository.save(immersionOutcome);
      const inDb = await client.query(
        "SELECT * FROM immersion_outcomes WHERE id = $1",
        [immersionOutcome.id],
      );
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        id: immersionOutcome.id,
        status: immersionOutcome.status,
        establishment_feedback: immersionOutcome.establishmentFeedback,
        convention_id: immersionOutcome.conventionId,
      });
    });
  });
});
