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

  describe("get", () => {
    it("returns empty array when ids do not exist", async () => {
      const result = await pgConventionTemplateQueries.get({
        ids: [uuid() as ConventionTemplate["id"]],
      });

      expect(result).toHaveLength(0);
    });

    it("returns empty array when user has no templates", async () => {
      const result = await pgConventionTemplateQueries.get({
        userIds: [validator.id],
      });

      expectToEqual(result, []);
    });

    it("returns only templates for the given ids", async () => {
      const template1: ConventionTemplate = {
        ...conventionTemplate,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Template 1",
        userId: validator.id,
      };
      const template2: ConventionTemplate = {
        ...conventionTemplate,
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Template 2",
        userId: validator.id,
      };
      await pgConventionTemplateQueries.upsert(template1, now);
      await pgConventionTemplateQueries.upsert(template2, now);

      const result = await pgConventionTemplateQueries.get({
        ids: [template1.id],
      });

      expectToEqual(result, [{ ...template1, updatedAt: now }]);
    });

    it("returns only templates for the given userIds", async () => {
      const otherUser = makeUniqueUserForTest(uuid());
      await new PgUserRepository(db).save(otherUser);

      const templateForValidator: ConventionTemplate = {
        ...conventionTemplate,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Validator template",
        userId: validator.id,
      };
      const templateForOther: ConventionTemplate = {
        ...conventionTemplate,
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Other user template",
        userId: otherUser.id,
      };
      await pgConventionTemplateQueries.upsert(templateForValidator, now);
      await pgConventionTemplateQueries.upsert(templateForOther, now);

      const result = await pgConventionTemplateQueries.get({
        userIds: [validator.id],
      });

      expectToEqual(result, [{ ...templateForValidator, updatedAt: now }]);
    });

    it("returns templates for the given id and userId", async () => {
      const template1: ConventionTemplate = {
        ...conventionTemplate,
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Template 1",
        userId: validator.id,
      };
      const template2: ConventionTemplate = {
        ...conventionTemplate,
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        name: "Template 2",
        userId: validator.id,
      };
      await pgConventionTemplateQueries.upsert(template1, now);
      await pgConventionTemplateQueries.upsert(template2, now);

      const result = await pgConventionTemplateQueries.get({
        ids: [template1.id],
        userIds: [validator.id],
      });

      expectToEqual(result, [{ ...template1, updatedAt: now }]);
    });
  });

  describe("upsert", () => {
    it("creates a row when id does not exist", async () => {
      await pgConventionTemplateQueries.upsert(conventionTemplate, now);

      const result = await pgConventionTemplateQueries.get({
        ids: [conventionTemplate.id],
      });

      expectToEqual(result, [
        {
          ...conventionTemplate,
          updatedAt: now,
        },
      ]);
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

      const result = await pgConventionTemplateQueries.get({
        ids: [conventionTemplate.id],
      });
      expectToEqual(result[0], {
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
