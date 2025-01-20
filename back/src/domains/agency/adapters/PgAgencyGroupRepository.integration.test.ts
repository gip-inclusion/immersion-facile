import { Pool } from "pg";
import { AgencyDtoBuilder, AgencyGroup, expectToEqual } from "shared";
import { v4 as uuid } from "uuid";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeUniqueUserForTest } from "../../../utils/user";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { PgAgencyGroupRepository } from "./PgAgencyGroupRepository";
import { PgAgencyRepository } from "./PgAgencyRepository";

const agency = new AgencyDtoBuilder().build();

describe("PgAgencyGroupRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgAgencyGroupRepository: PgAgencyGroupRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgUserRepository: PgUserRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agencies").execute();

    pgAgencyGroupRepository = new PgAgencyGroupRepository(db);
    pgAgencyRepository = new PgAgencyRepository(db);
    pgUserRepository = new PgUserRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getByCodeSafir", () => {
    it("returns undefined when no group matches safirCode", async () => {
      const result =
        await pgAgencyGroupRepository.getByCodeSafir("not-found-safir");

      expect(result).toBeUndefined();
    });

    it("should return an agency group by code safir", async () => {
      const agencyGroup: AgencyGroup = {
        siret: "11112222333344",
        codeSafir: "123456",
        name: "Some agency group",
        email: "myagency@mail.com",
        kind: "france-travail",
        scope: "direction-régionale",
        departments: ["75", "92"],
        ccEmails: [],
        agencyIds: [agency.id],
      };

      await insertAgencyGroup({
        db,
        pgAgencyRepository,
        pgUserRepository,
        agencyGroup,
      });

      const result = await pgAgencyGroupRepository.getByCodeSafir(
        agencyGroup.codeSafir,
      );

      expectToEqual(result, agencyGroup);
    });
  });
});

const insertAgencyGroup = async ({
  db,
  pgAgencyRepository,
  pgUserRepository,
  agencyGroup,
}: {
  db: KyselyDb;
  pgAgencyRepository: PgAgencyRepository;
  pgUserRepository: PgUserRepository;
  agencyGroup: AgencyGroup;
}) => {
  if (
    agencyGroup.agencyIds.length > 1 &&
    agencyGroup.agencyIds[0] !== agency.id
  )
    throw new Error("Agency not supported in tests. tests");

  const validator = makeUniqueUserForTest(uuid());

  await pgUserRepository.save(validator, "proConnect");

  await pgAgencyRepository.insert(
    toAgencyWithRights(agency, {
      [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
    }),
  );

  const [{ id: agencyGroupId }] = await db
    .insertInto("agency_groups")
    .values({
      siret: agencyGroup.siret,
      name: agencyGroup.name,
      email: agencyGroup.email,
      kind: agencyGroup.kind,
      scope: agencyGroup.scope,
      code_safir: agencyGroup.codeSafir,
      departments: JSON.stringify(agencyGroup.departments),
      cc_emails: agencyGroup.ccEmails
        ? JSON.stringify(agencyGroup.ccEmails)
        : null,
    })
    .returning("id")
    .execute();

  if (agencyGroup.agencyIds.length > 0) {
    await db
      .insertInto("agency_groups__agencies")
      .values({
        agency_group_id: agencyGroupId,
        agency_id: agency.id,
      })
      .execute();
  }
};
