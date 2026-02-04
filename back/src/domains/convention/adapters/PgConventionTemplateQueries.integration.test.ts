import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  type ConventionTemplate,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeUniqueUserForTest } from "../../../utils/user";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgUserRepository } from "../../core/authentication/connected-user/adapters/PgUserRepository";
import { PgConventionTemplateQueries } from "./PgConventionTemplateQueries";

describe("PgConventionTemplateQueries", () => {
  let pool: Pool;
  let pgConventionTemplateQueries: PgConventionTemplateQueries;
  let db: KyselyDb;
  const agency = new AgencyDtoBuilder().withId(uuid()).build();
  const validator = makeUniqueUserForTest(uuid());
  const conventionTemplate: ConventionTemplate = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Mon modèle",
    internshipKind: "immersion",
    agencyId: agency.id,
    userId: validator.id,
  };
  const now = "2024-10-08T00:00:00.000Z";

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);

    await new PgUserRepository(db).save(validator);
    await new PgAgencyRepository(db).insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );
  });

  beforeEach(async () => {
    await db.deleteFrom("convention_templates").execute();
    pgConventionTemplateQueries = new PgConventionTemplateQueries(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getById", () => {
    it("returns undefined when id does not exist", async () => {
      const result = await pgConventionTemplateQueries.getById(
        uuid() as ConventionTemplate["id"],
      );

      expect(result).toBeUndefined();
    });
  });

  describe("upsert", () => {
    it("creates a row when id does not exist", async () => {
      await pgConventionTemplateQueries.upsert(conventionTemplate, now);

      const result = await pgConventionTemplateQueries.getById(
        conventionTemplate.id,
      );

      expectToEqual(result, {
        ...conventionTemplate,
        updatedAt: now,
      });
    });

    it("updates the row when id already exists", async () => {
      await pgConventionTemplateQueries.upsert(conventionTemplate, now);

      await pgConventionTemplateQueries.upsert(
        {
          ...conventionTemplate,
          name: "Updated name",
          signatories: {
            beneficiary: {
              role: "beneficiary",
              email: "beneficiary@example.com",
              firstName: "Marie",
              lastName: "Martin",
            },
            establishmentRepresentative: {
              role: "establishment-representative",
              email: "rep@example.com",
              firstName: "Pierre",
              lastName: "Bernard",
            },
          },
        },
        now,
      );

      const result = await pgConventionTemplateQueries.getById(
        conventionTemplate.id,
      );
      expectToEqual(result, {
        ...conventionTemplate,
        name: "Updated name",
        updatedAt: now,
        signatories: {
          beneficiary: {
            role: "beneficiary",
            email: "beneficiary@example.com",
            firstName: "Marie",
            lastName: "Martin",
          },
          establishmentRepresentative: {
            role: "establishment-representative",
            email: "rep@example.com",
            firstName: "Pierre",
            lastName: "Bernard",
          },
        },
      });
    });
  });
});
