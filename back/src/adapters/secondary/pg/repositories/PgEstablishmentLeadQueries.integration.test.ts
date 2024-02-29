import { subDays } from "date-fns";
import { Pool } from "pg";
import { AgencyDtoBuilder, ConventionDtoBuilder, expectToEqual } from "shared";
import { EstablishmentLead } from "../../../../domains/establishment/entities/EstablishmentLeadEntity";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgConventionRepository } from "./PgConventionRepository";
import { PgEstablishmentLeadQueries } from "./PgEstablishmentLeadQueries";
import { PgEstablishmentLeadRepository } from "./PgEstablishmentLeadRepository";

const siret1 = "12345678901234";
const siret2 = "12345671234567";
const conventionId1 = "a99eaca1-ee70-4c90-b3f4-777777777777";
const conventionId2 = "a99eaca1-ee70-4c90-b3f4-888888888888";
const agencyId = "bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaff";

const agency = new AgencyDtoBuilder().withId(agencyId).build();

const convention1 = new ConventionDtoBuilder()
  .withId(conventionId1)
  .withAgencyId(agencyId)
  .withSiret(siret1)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const convention2 = new ConventionDtoBuilder()
  .withId(conventionId2)
  .withAgencyId(agencyId)
  .withSiret(siret2)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

const establishmentLead1: EstablishmentLead = {
  siret: siret1,
  lastEventKind: "to-be-reminded",
  events: [
    {
      conventionId: convention1.id,
      kind: "to-be-reminded",
      occurredAt: new Date(),
    },
  ],
};

const establishmentLead2: EstablishmentLead = {
  siret: siret2,
  lastEventKind: "reminder-sent",
  events: [
    {
      conventionId: convention2.id,
      kind: "to-be-reminded",
      occurredAt: subDays(new Date(), 3),
    },
    {
      kind: "reminder-sent",
      notification: {
        id: "33333333-3333-4c90-3333-333333333333",
        kind: "email",
      },
      occurredAt: subDays(new Date(), 2),
    },
  ],
};

describe("PgEstablishmentLeadQueries", () => {
  let pool: Pool;
  let establishmentLeadQueries: PgEstablishmentLeadQueries;
  let establishmentLeadRepository: PgEstablishmentLeadRepository;
  let conventionRepository: PgConventionRepository;
  let agencyRepo: PgAgencyRepository;
  let kyselyDb: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    kyselyDb = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await kyselyDb.deleteFrom("conventions").execute();
    await kyselyDb.deleteFrom("agencies").execute();
    await kyselyDb.deleteFrom("establishment_lead_events").execute();

    establishmentLeadQueries = new PgEstablishmentLeadQueries(kyselyDb);
    establishmentLeadRepository = new PgEstablishmentLeadRepository(kyselyDb);
    agencyRepo = new PgAgencyRepository(kyselyDb);
    conventionRepository = new PgConventionRepository(kyselyDb);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getLastConventionsByLastEventKind", () => {
    it("returns empty array when no data matches", async () => {
      const result =
        await establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
          kind: "to-be-reminded",
        });
      expectToEqual(result, []);
    });

    it("get the last convention by last event kind ", async () => {
      await agencyRepo.insert(agency);
      await Promise.all([
        conventionRepository.save(convention1),
        conventionRepository.save(convention2),
        establishmentLeadRepository.save(establishmentLead1),
        establishmentLeadRepository.save(establishmentLead2),
      ]);

      const result =
        await establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
          kind: "to-be-reminded",
        });
      expectToEqual(result, [
        {
          ...convention1,
          agencyDepartment: agency.address.departmentCode,
          agencyName: agency.name,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        },
      ]);
    });
  });
});
