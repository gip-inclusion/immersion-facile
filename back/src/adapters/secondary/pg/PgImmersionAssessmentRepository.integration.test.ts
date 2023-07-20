import { Kysely, PostgresDialect } from "kysely";
import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ImmersionAssessmentEntity } from "../../../domain/convention/entities/ImmersionAssessmentEntity";
import { ImmersionDatabase } from "./sql/database";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgConventionRepository } from "./PgConventionRepository";
import { PgImmersionAssessmentRepository } from "./PgImmersionAssessmentRepository";

const conventionId = "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa";

const convention = new ConventionDtoBuilder().withId(conventionId).build();

const assessment: ImmersionAssessmentEntity = {
  _entityName: "ImmersionAssessment",
  conventionId,
  status: "FINISHED",
  establishmentFeedback: "Ca s'est bien passé",
};

describe("PgImmersionAssessmentRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let immersionAssessmentRepository: PgImmersionAssessmentRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    const agencyRepository = new PgAgencyRepository(
      new Kysely<ImmersionDatabase>({
        dialect: new PostgresDialect({ pool }),
      }),
    );
    await agencyRepository.insert(AgencyDtoBuilder.create().build());
    const conventionRepository = new PgConventionRepository(client);
    await conventionRepository.save(convention);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_assessments");
    immersionAssessmentRepository = new PgImmersionAssessmentRepository(client);
  });

  describe("save", () => {
    it("fails to save when it does not match an existing Convention", async () => {
      await expectPromiseToFailWithError(
        immersionAssessmentRepository.save({
          ...assessment,
          conventionId: "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        }),
        new Error(
          "No convention found for id 40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        ),
      );
    });

    it("when all is good", async () => {
      await immersionAssessmentRepository.save(assessment);
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
      const notFoundImmersion =
        await immersionAssessmentRepository.getByConventionId(
          "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        );

      expect(notFoundImmersion).toBeUndefined();
    });

    it("returns assessment found", async () => {
      await immersionAssessmentRepository.save(assessment);
      const assessmentInDb =
        await immersionAssessmentRepository.getByConventionId(
          assessment.conventionId,
        );

      expectToEqual(assessmentInDb, assessment);
    });
  });
});
