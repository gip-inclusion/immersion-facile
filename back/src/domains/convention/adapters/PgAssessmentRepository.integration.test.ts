import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeKyselyDb } from "../../../adapters/secondary/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../adapters/secondary/pg/pgUtils";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { AssessmentEntity } from "../entities/AssessmentEntity";
import { PgAssessmentRepository } from "./PgAssessmentRepository";
import { PgConventionRepository } from "./PgConventionRepository";

const conventionId = "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa";

const convention = new ConventionDtoBuilder().withId(conventionId).build();

const assessment: AssessmentEntity = {
  _entityName: "Assessment",
  conventionId,
  status: "FINISHED",
  establishmentFeedback: "Ca s'est bien passé",
};

describe("PgAssessmentRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let assessmentRepository: PgAssessmentRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    const transaction = makeKyselyDb(pool);
    const agencyRepository = new PgAgencyRepository(transaction);
    await agencyRepository.insert(AgencyDtoBuilder.create().build());
    const conventionRepository = new PgConventionRepository(transaction);
    await conventionRepository.save(convention);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_assessments");
    assessmentRepository = new PgAssessmentRepository(makeKyselyDb(pool));
  });

  describe("save", () => {
    it("fails to save when it does not match an existing Convention", async () => {
      await expectPromiseToFailWithError(
        assessmentRepository.save({
          ...assessment,
          conventionId: "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        }),
        new Error(
          "No convention found for id 40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        ),
      );
    });

    it("when all is good", async () => {
      await assessmentRepository.save(assessment);
      const inDb = await client.query("SELECT * FROM immersion_assessments");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        status: assessment.status,
        establishment_feedback: assessment.establishmentFeedback,
        convention_id: assessment.conventionId,
      });
    });
  });

  describe("getByConventionId", () => {
    it("returns undefined if no Convention where found", async () => {
      const notFoundImmersion = await assessmentRepository.getByConventionId(
        "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
      );

      expect(notFoundImmersion).toBeUndefined();
    });

    it("returns assessment found", async () => {
      await assessmentRepository.save(assessment);
      const assessmentInDb = await assessmentRepository.getByConventionId(
        assessment.conventionId,
      );

      expectToEqual(assessmentInDb, assessment);
    });
  });
});
