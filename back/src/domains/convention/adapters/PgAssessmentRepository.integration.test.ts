import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { AssessmentEntity } from "../entities/AssessmentEntity";
import { PgAssessmentRepository } from "./PgAssessmentRepository";
import { PgConventionRepository } from "./PgConventionRepository";

const conventionId = "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaaa";

const convention = new ConventionDtoBuilder().withId(conventionId).build();

const assessment: AssessmentEntity = {
  _entityName: "Assessment",
  conventionId,
  status: "COMPLETED",
  endedWithAJob: false,
  establishmentFeedback: "Ca s'est bien passé",
  establishmentAdvices: "mon conseil",
};

describe("PgAssessmentRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let assessmentRepository: PgAssessmentRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);

    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();

    await new PgAgencyRepository(db).insert(
      toAgencyWithRights(AgencyDtoBuilder.create().build()),
    );
    await new PgConventionRepository(db).save(convention);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    assessmentRepository = new PgAssessmentRepository(db);
    await db.deleteFrom("immersion_assessments").execute();
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
      const allAssessmentsQueryBuilder = db
        .selectFrom("immersion_assessments")
        .selectAll();

      expectToEqual(await allAssessmentsQueryBuilder.execute(), []);

      await assessmentRepository.save(assessment);

      expectArraysToMatch(await allAssessmentsQueryBuilder.execute(), [
        {
          convention_id: assessment.conventionId,
          status: assessment.status,
          last_day_of_presence: null,
          number_of_missed_hours: null,
          ended_wit_a_job: false,
          type_of_contract: null,
          contract_start_date: null,
          establishment_feedback: assessment.establishmentFeedback,
          establishment_advices: assessment.establishmentAdvices,
        },
      ]);
    });
  });

  describe("getByConventionId", () => {
    it("returns undefined if no Convention where found", async () => {
      expectToEqual(
        await assessmentRepository.getByConventionId(
          "40400c99-9c0b-bbbb-bb6d-6bb9bd300404",
        ),
        undefined,
      );
    });

    it("returns assessment found", async () => {
      await assessmentRepository.save(assessment);

      expectToEqual(
        await assessmentRepository.getByConventionId(assessment.conventionId),
        assessment,
      );
    });
  });
});
