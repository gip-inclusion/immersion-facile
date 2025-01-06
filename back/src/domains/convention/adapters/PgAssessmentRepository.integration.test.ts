import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  AssessmentDtoBuilder,
  ConventionDtoBuilder,
  errors,
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

const minimalAssessment: AssessmentEntity = {
  ...new AssessmentDtoBuilder().withMinimalInformations().build(),
  _entityName: "Assessment",
};

const fullAssessment: AssessmentEntity = {
  ...new AssessmentDtoBuilder().withFullInformations().build(),
  _entityName: "Assessment",
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
      const conventionId = "40400c99-9c0b-bbbb-bb6d-6bb9bd300404";
      await expectPromiseToFailWithError(
        assessmentRepository.save({
          ...minimalAssessment,
          conventionId,
        }),
        errors.convention.notFound({ conventionId }),
      );
    });

    it("saves a minimal assessment", async () => {
      expectToEqual(
        await assessmentRepository.getByConventionId(
          minimalAssessment.conventionId,
        ),
        undefined,
      );

      await assessmentRepository.save(minimalAssessment);

      expect(
        await db.selectFrom("immersion_assessments").selectAll().execute(),
      ).toHaveLength(1);
      expectToEqual(
        await assessmentRepository.getByConventionId(
          minimalAssessment.conventionId,
        ),
        minimalAssessment,
      );
    });

    it("saves a full assessment", async () => {
      expectToEqual(
        await assessmentRepository.getByConventionId(
          fullAssessment.conventionId,
        ),
        undefined,
      );

      await assessmentRepository.save(fullAssessment);

      expect(
        await db.selectFrom("immersion_assessments").selectAll().execute(),
      ).toHaveLength(1);
      expectToEqual(
        await assessmentRepository.getByConventionId(
          fullAssessment.conventionId,
        ),
        fullAssessment,
      );
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
      await assessmentRepository.save(minimalAssessment);

      expectToEqual(
        await assessmentRepository.getByConventionId(
          minimalAssessment.conventionId,
        ),
        minimalAssessment,
      );
    });
    it("returns assessment found with all fields", async () => {
      await assessmentRepository.save(fullAssessment);

      expectToEqual(
        await assessmentRepository.getByConventionId(
          fullAssessment.conventionId,
        ),
        fullAssessment,
      );
    });
  });
});
