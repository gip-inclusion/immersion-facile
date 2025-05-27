import { addDays, subDays } from "date-fns";
import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  expectToEqual,
  reasonableSchedule,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeUniqueUserForTest } from "../../../utils/user";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../../convention/adapters/PgConventionRepository";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import type { EstablishmentLead } from "../entities/EstablishmentLeadEntity";
import { PgEstablishmentLeadQueries } from "./PgEstablishmentLeadQueries";
import { PgEstablishmentLeadRepository } from "./PgEstablishmentLeadRepository";

const anyConventionUpdatedAt = new Date("2022-05-20T12:43:11").toISOString();
const siret1 = "12345678901234";
const siret2 = "12345671234567";
const conventionId1 = "a99eaca1-ee70-4c90-b3f4-777777777777";
const conventionId2 = "a99eaca1-ee70-4c90-b3f4-888888888888";
const conventionId3 = "a99eaca1-ee70-4c90-b3f4-999999999999";
const agencyId = "bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaff";

const agency = new AgencyDtoBuilder().withId(agencyId).build();

const convention1 = new ConventionDtoBuilder()
  .withId(conventionId1)
  .withDateStart("2025-05-01T00:00:00.000Z")
  .withDateEnd("2025-05-10T00:00:00.000Z")
  .withSchedule(reasonableSchedule)
  .withAgencyId(agencyId)
  .withSiret(siret1)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .withUpdatedAt(anyConventionUpdatedAt)
  .build();

const convention2 = new ConventionDtoBuilder()
  .withId(conventionId2)
  .withDateStart("2025-05-01T00:00:00.000Z")
  .withDateEnd("2025-05-10T00:00:00.000Z")
  .withSchedule(reasonableSchedule)
  .withAgencyId(agencyId)
  .withSiret(siret2)
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .withUpdatedAt(anyConventionUpdatedAt)
  .build();

const convention3 = new ConventionDtoBuilder()
  .withId(conventionId3)
  .withAgencyId(agencyId)
  .withSiret(siret1)
  .withoutDateValidation()
  .withStatus("DEPRECATED")
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
  let pgUserRepository: PgUserRepository;
  let conventionRepository: PgConventionRepository;
  let agencyRepo: PgAgencyRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("establishment_lead_events").execute();

    establishmentLeadQueries = new PgEstablishmentLeadQueries(db);
    establishmentLeadRepository = new PgEstablishmentLeadRepository(db);
    agencyRepo = new PgAgencyRepository(db);
    conventionRepository = new PgConventionRepository(db);
    pgUserRepository = new PgUserRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getLastConventionsByLastEventKind", () => {
    it("returns empty array when no data matches", async () => {
      const result =
        await establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
          conventionEndDateGreater: new Date(convention1.dateEnd),
          kind: "to-be-reminded",
          maxResults: 1000,
        });
      expectToEqual(result, []);
    });

    it("returns empty array when convention ended only 5 days ago", async () => {
      const validator = makeUniqueUserForTest(uuid());

      await pgUserRepository.save(validator);
      await agencyRepo.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );
      await Promise.all([
        conventionRepository.save(convention1),
        establishmentLeadRepository.save(establishmentLead1),
      ]);

      const result =
        await establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
          conventionEndDateGreater: addDays(new Date(convention1.dateEnd), 1),
          kind: "to-be-reminded",
          maxResults: 1000,
        });
      expectToEqual(result, []);
    });

    it("get the last convention by last event kind", async () => {
      const validator = makeUniqueUserForTest(uuid());

      await pgUserRepository.save(validator);
      await agencyRepo.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );
      await Promise.all([
        conventionRepository.save(convention1, anyConventionUpdatedAt),
        conventionRepository.save(convention2, anyConventionUpdatedAt),
        conventionRepository.save(convention3, anyConventionUpdatedAt),
        establishmentLeadRepository.save(establishmentLead1),
        establishmentLeadRepository.save(establishmentLead2),
      ]);

      const result =
        await establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
          conventionEndDateGreater: subDays(new Date(convention1.dateEnd), 1),
          kind: "to-be-reminded",
          maxResults: 1000,
        });
      expectToEqual(result, [convention1]);
    });

    it("gives a number of result respecting provided maximum", async () => {
      const establishmentLeadForConvention2: EstablishmentLead = {
        siret: convention2.siret,
        lastEventKind: "to-be-reminded",
        events: [
          {
            conventionId: convention2.id,
            kind: "to-be-reminded",
            occurredAt: new Date(),
          },
        ],
      };

      const validator = makeUniqueUserForTest(uuid());

      await pgUserRepository.save(validator);
      await agencyRepo.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );
      await Promise.all([
        conventionRepository.save(convention1, anyConventionUpdatedAt),
        conventionRepository.save(convention2, anyConventionUpdatedAt),
        establishmentLeadRepository.save(establishmentLead1),
        establishmentLeadRepository.save(establishmentLeadForConvention2),
      ]);

      const result =
        await establishmentLeadQueries.getLastConventionsByUniqLastEventKind({
          conventionEndDateGreater: subDays(new Date(convention1.dateEnd), 1),
          kind: "to-be-reminded",
          maxResults: 1,
        });
      expectToEqual(result, [convention2]);
    });
  });
});
