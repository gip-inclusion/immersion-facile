import { Pool } from "pg";
import { AgencyDtoBuilder, ConventionDtoBuilder } from "shared";
import { v4 as uuid } from "uuid";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeUniqueUserForTest } from "../../../utils/user";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { PgConventionExternalIdRepository } from "./PgConventionExternalIdRepository";
import { PgConventionRepository } from "./PgConventionRepository";

describe("PgConventionExternalIdRepository", () => {
  let pgConventionExternalIdRepository: PgConventionExternalIdRepository;
  let pgConventionRepository: PgConventionRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgUserRepository: PgUserRepository;
  let pool: Pool;
  let db: KyselyDb;

  beforeAll(() => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgConventionRepository = new PgConventionRepository(db);
    pgConventionExternalIdRepository = new PgConventionExternalIdRepository(db);
    pgAgencyRepository = new PgAgencyRepository(db);
    pgUserRepository = new PgUserRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("convention_external_ids").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agencies").execute();
  });

  describe("save", () => {
    it("saves a conventionId and creates a corresponding conventionExternalId, then gets it by id", async () => {
      const convention = new ConventionDtoBuilder().withId(uuid()).build();
      const validator = makeUniqueUserForTest(uuid());

      await pgUserRepository.save(validator, "proConnect");
      await pgAgencyRepository.insert(
        toAgencyWithRights(
          new AgencyDtoBuilder().withId(convention.agencyId).build(),
          {
            [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          },
        ),
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
