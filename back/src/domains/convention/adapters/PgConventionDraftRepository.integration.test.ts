import type { Pool } from "pg";
import { type ConventionDraftDto, expectToEqual } from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import { PgConventionDraftRepository } from "./PgConventionDraftRepository";

describe("PgConventionDraftRepository", () => {
  let pool: Pool;
  let pgConventionDraftRepository: PgConventionDraftRepository;
  let db: KyselyDb;

  beforeAll(() => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("convention_drafts").execute();
    pgConventionDraftRepository = new PgConventionDraftRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("save", () => {
    it("saves a minimal convention draft", async () => {
      const conventionDraft: ConventionDraftDto = {
        id: uuid(),
        internshipKind: "immersion",
      };

      await pgConventionDraftRepository.save(conventionDraft, "2024-10-08");

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );
      expectToEqual(result, {
        id: conventionDraft.id,
        internshipKind: "immersion",
      });
    });

    it("saves a convention draft with more fields", async () => {
      const conventionDraft: ConventionDraftDto = {
        id: uuid(),
        agencyKind: "mission-locale",
        agencyDepartment: "75",
        dateStart: "2024-10-08T00:00:00.000Z",
        dateEnd: "2024-10-17T00:00:00.000Z",
        siret: "12345678901234",
        businessName: "Test Business",
        individualProtection: true,
        individualProtectionDescription: "casque et lunettes",
        sanitaryPrevention: true,
        sanitaryPreventionDescription: "fourniture de gel",
        immersionAddress: "169 boulevard de la villette, 75010 Paris",
        immersionObjective: "Confirmer un projet professionnel",
        immersionActivities: "Piloter un automobile",
        immersionSkills: "Utilisation des pneus optimale",
        workConditions: "Travail en équipe",
        internshipKind: "immersion",
        businessAdvantages: "Prise en charge du panier repas",
        acquisitionCampaign: "campaign-2024",
        acquisitionKeyword: "emploi",
        establishmentNumberEmployeesRange: "10-19",
        agencyReferent: {
          firstname: "Sophie",
          lastname: "Durand",
        },
        immersionAppellation: {
          appellationCode: "11573",
          appellationLabel: "Boulanger / Boulangère",
          romeCode: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
        },
      };

      await pgConventionDraftRepository.save(conventionDraft, "2024-10-08");

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );

      expectToEqual(result, conventionDraft);
    });

    it("saves a convention draft with jsonb fields", async () => {
      const conventionDraft: ConventionDraftDto = {
        id: uuid(),
        internshipKind: "immersion",
        establishmentTutor: {
          role: "establishment-tutor",
          email: "tutor@example.com",
          phone: "+33123456789",
          firstName: "Jean",
          lastName: "Dupont",
          job: "Manager",
        },
        schedule: {
          totalHours: 35,
          workedDays: 5,
          isSimple: true,
          complexSchedule: [
            {
              date: "2024-10-08",
              timePeriods: [{ start: "09:00", end: "17:00" }],
            },
          ],
        },
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
      };

      await pgConventionDraftRepository.save(conventionDraft, "2024-10-08");

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );
      expectToEqual(result, conventionDraft);
    });
  });

  describe("getById", () => {
    it("returns undefined when draft does not exist", async () => {
      const result = await pgConventionDraftRepository.getById(uuid());
      expect(result).toBeUndefined();
    });

    it("returns the convention draft with all fields properly mapped", async () => {
      const conventionDraft: ConventionDraftDto = {
        id: uuid(),
        dateStart: "2024-10-08T00:00:00.000Z",
        dateEnd: "2024-10-17T00:00:00.000Z",
        siret: "12345678901234",
        businessName: "Test Business",
        individualProtection: true,
        individualProtectionDescription: "casque et lunettes",
        sanitaryPrevention: true,
        sanitaryPreventionDescription: "fourniture de gel",
        immersionAddress: "169 boulevard de la villette, 75010 Paris",
        immersionObjective: "Confirmer un projet professionnel",
        immersionActivities: "Piloter un automobile",
        immersionSkills: "Utilisation des pneus optimale",
        workConditions: "Travail en équipe",
        internshipKind: "immersion",
        businessAdvantages: "Prise en charge du panier repas",
        acquisitionCampaign: "campaign-2024",
        acquisitionKeyword: "emploi",
        establishmentNumberEmployeesRange: "10-19",
        agencyReferent: {
          firstname: "Sophie",
          lastname: "Durand",
        },
        immersionAppellation: {
          appellationCode: "11573",
          appellationLabel: "Boulanger / Boulangère",
          romeCode: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
        },
        schedule: {
          totalHours: 35,
          workedDays: 5,
          isSimple: true,
          complexSchedule: [
            {
              date: "2024-10-08",
              timePeriods: [{ start: "09:00", end: "17:00" }],
            },
          ],
        },
        establishmentTutor: {
          role: "establishment-tutor",
          email: "tutor@example.com",
          phone: "+33123456789",
          firstName: "Jean",
          lastName: "Dupont",
          job: "Manager",
        },
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
      };

      await pgConventionDraftRepository.save(conventionDraft, "2024-10-08");

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );

      expectToEqual(result, conventionDraft);
    });
  });
});
