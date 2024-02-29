import { Pool } from "pg";
import { AgencyDtoBuilder, AgencyGroup, expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../adapters/secondary/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../adapters/secondary/pg/pgUtils";
import { PgAgencyGroupRepository } from "./PgAgencyGroupRepository";
import { PgAgencyRepository } from "./PgAgencyRepository";

const agency = new AgencyDtoBuilder().build();

describe("PgAgencyGroupRepository", () => {
  let pool: Pool;
  let transaction: KyselyDb;
  let pgAgencyGroupRepository: PgAgencyGroupRepository;
  let pgAgencyRepository: PgAgencyRepository;

  beforeEach(async () => {
    pool = getTestPgPool();
    transaction = makeKyselyDb(pool);

    await transaction.deleteFrom("agency_groups__agencies").execute();
    await transaction.deleteFrom("agency_groups").execute();
    await transaction.deleteFrom("conventions").execute();
    await transaction.deleteFrom("agencies").execute();

    pgAgencyGroupRepository = new PgAgencyGroupRepository(transaction);
    pgAgencyRepository = new PgAgencyRepository(transaction);
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

      await insertAgencyGroup(agencyGroup);

      const result = await pgAgencyGroupRepository.getByCodeSafir(
        agencyGroup.codeSafir,
      );

      expectToEqual(result, agencyGroup);
    });
  });

  const insertAgencyGroup = async (agencyGroup: AgencyGroup) => {
    if (
      agencyGroup.agencyIds.length > 1 &&
      agencyGroup.agencyIds[0] !== agency.id
    )
      throw new Error("Agency not supported in tests. tests");

    await pgAgencyRepository.insert(agency);

    const [{ id: agencyGroupId }] = await transaction
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
      await transaction
        .insertInto("agency_groups__agencies")
        .values({
          agency_group_id: agencyGroupId,
          agency_id: agency.id,
        })
        .execute();
    }
  };
});
