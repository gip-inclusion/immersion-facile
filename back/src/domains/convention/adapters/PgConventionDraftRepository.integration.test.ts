import { subDays } from "date-fns";
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
  const now = "2024-10-08T00:00:00.000Z";
  let pool: Pool;
  let pgConventionDraftRepository: PgConventionDraftRepository;
  let db: KyselyDb;

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

  const conventionDraft2: ConventionDraftDto = {
    id: uuid(),
    dateStart: "2024-12-02T00:00:00.000Z",
    dateEnd: "2024-12-13T00:00:00.000Z",
    siret: "45678912345678",
    businessName: "Crêperie de la Pointe du Raz",
    individualProtection: true,
    individualProtectionDescription:
      "tablier, charlotte et chaussures antidérapantes",
    sanitaryPrevention: true,
    sanitaryPreventionDescription:
      "formation hygiène alimentaire et équipements de lavage",
    immersionAddress: "1 route de la Pointe du Raz, 29770 Plogoff",
    immersionObjective: "Initier une démarche de recrutement",
    immersionActivities: "Préparation de crêpes et galettes, service en salle",
    immersionSkills:
      "Techniques de crêperie, gestion des commandes, accueil client",
    workConditions:
      "Travail debout, horaires variables selon affluence touristique",
    internshipKind: "immersion",
    businessAdvantages: "Repas fournis et vue sur l'océan",
    acquisitionCampaign: "campaign-2024",
    acquisitionKeyword: "restauration",
    establishmentNumberEmployeesRange: "3-5",
    agencyReferent: {
      firstname: "Morgane",
      lastname: "Le Goff",
    },
    immersionAppellation: {
      appellationCode: "13241",
      appellationLabel: "Crêpier / Crêpière",
      romeCode: "G1603",
      romeLabel: "Personnel polyvalent en restauration",
    },
    schedule: {
      totalHours: 35,
      workedDays: 5,
      isSimple: true,
      complexSchedule: [
        {
          date: "2024-12-02",
          timePeriods: [
            { start: "10:00", end: "14:00" },
            { start: "18:00", end: "22:00" },
          ],
        },
      ],
    },
    establishmentTutor: {
      role: "establishment-tutor",
      email: "yann.morzadec@creperie-pointeduraz.fr",
      phone: "+33298706543",
      firstName: "Yann",
      lastName: "Morzadec",
      job: "Maître crêpier",
    },
    signatories: {
      beneficiary: {
        role: "beneficiary",
        email: "annaig.kergoat@email.fr",
        firstName: "Annaïg",
        lastName: "Kergoat",
      },
      establishmentRepresentative: {
        role: "establishment-representative",
        email: "direction@creperie-pointeduraz.fr",
        firstName: "Rozenn",
        lastName: "Morzadec",
      },
    },
  };

  const conventionDraft3: ConventionDraftDto = {
    id: uuid(),
    dateStart: "2025-01-06T00:00:00.000Z",
    dateEnd: "2025-01-17T00:00:00.000Z",
    siret: "78912345678901",
    businessName: "Auberge du Port de Concarneau",
    individualProtection: true,
    individualProtectionDescription:
      "chaussures antidérapantes, tablier et gants de protection",
    sanitaryPrevention: true,
    sanitaryPreventionDescription:
      "respect des normes HACCP, lavage des mains régulier et charlotte obligatoire",
    immersionAddress: "12 quai Carnot, 29900 Concarneau",
    immersionObjective: "Découvrir un métier ou un secteur d'activité",
    immersionActivities:
      "Accueil des clients, prise de commandes, service des plats et entretien de la salle",
    immersionSkills:
      "Relation client, port de plateaux, coordination avec la cuisine",
    workConditions:
      "Travail en station debout prolongée, rythme soutenu en période touristique",
    internshipKind: "immersion",
    businessAdvantages: "Repas sur place et équipe conviviale",
    acquisitionCampaign: "campaign-2025",
    acquisitionKeyword: "restauration-bretagne",
    establishmentNumberEmployeesRange: "6-9",
    agencyReferent: {
      firstname: "Erwan",
      lastname: "Le Bihan",
    },
    immersionAppellation: {
      appellationCode: "11022",
      appellationLabel: "Serveur / Serveuse en restauration",
      romeCode: "G1803",
      romeLabel: "Service en restauration",
    },
    schedule: {
      totalHours: 35,
      workedDays: 5,
      isSimple: true,
      complexSchedule: [
        {
          date: "2025-01-06",
          timePeriods: [
            { start: "11:00", end: "15:00" },
            { start: "18:30", end: "22:30" },
          ],
        },
      ],
    },
    establishmentTutor: {
      role: "establishment-tutor",
      email: "marc.le-guen@auberge-concarneau.fr",
      phone: "+33298971234",
      firstName: "Marc",
      lastName: "Le Guen",
      job: "Responsable de salle",
    },
    signatories: {
      beneficiary: {
        role: "beneficiary",
        email: "loeiza.guillemot@email.fr",
        firstName: "Loeiza",
        lastName: "Guillemot",
      },
      establishmentRepresentative: {
        role: "establishment-representative",
        email: "direction@auberge-concarneau.fr",
        firstName: "Anne",
        lastName: "Le Guen",
      },
    },
  };

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
    it("create a minimal convention draft", async () => {
      const conventionDraft: ConventionDraftDto = {
        id: uuid(),
        internshipKind: "immersion",
      };

      await pgConventionDraftRepository.save(conventionDraft, now);

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );
      expectToEqual(result, {
        id: conventionDraft.id,
        internshipKind: "immersion",
        updatedAt: now,
      });
    });

    it("create a convention draft with more fields", async () => {
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

      await pgConventionDraftRepository.save(conventionDraft, now);

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );

      expectToEqual(result, {
        ...conventionDraft,
        updatedAt: now,
      });
    });

    it("create a convention draft with jsonb fields", async () => {
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

      await pgConventionDraftRepository.save(conventionDraft, now);

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );
      expectToEqual(result, {
        ...conventionDraft,
        updatedAt: now,
      });
    });

    it("update a convention draft", async () => {
      const conventionDraft: ConventionDraftDto = {
        id: uuid(),
        internshipKind: "immersion",
        businessName: "Test Business",
      };

      await pgConventionDraftRepository.save(conventionDraft, now);

      const updatedConventionDraft: ConventionDraftDto = {
        id: conventionDraft.id,
        internshipKind: "immersion",
        businessName: "Updated Test Business",
      };

      await pgConventionDraftRepository.save(updatedConventionDraft, now);

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );
      expectToEqual(result, {
        ...updatedConventionDraft,
        updatedAt: now,
      });
    });
  });

  describe("getById", () => {
    it("returns undefined when draft does not exist", async () => {
      const result = await pgConventionDraftRepository.getById(uuid());
      expect(result).toBeUndefined();
    });

    it("returns the convention draft with all fields properly mapped", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );

      expectToEqual(result, {
        ...conventionDraft,
        updatedAt: now,
      });
    });
  });

  describe("getConventionDraftIdsByFilters", () => {
    const thirtyDaysAgo = subDays(new Date(now), 30).toISOString();
    const fourtyDaysAgo = subDays(new Date(now), 40).toISOString();

    it("should return all ids when no filters are provided", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);
      await pgConventionDraftRepository.save(conventionDraft2, now);

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({});

      expectToEqual(result, [conventionDraft.id, conventionDraft2.id]);
    });

    it("should return only the ids matching the provided ids filter", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);
      await pgConventionDraftRepository.save(conventionDraft2, now);

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({
          ids: [conventionDraft.id],
        });

      expectToEqual(result, [conventionDraft.id]);
    });

    it("should return only ids not updated after the provided lastUpdatedAt date", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);
      await pgConventionDraftRepository.save(conventionDraft2, thirtyDaysAgo);

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({
          lastUpdatedAt: new Date(thirtyDaysAgo),
        });

      expectToEqual(result, [conventionDraft2.id]);
    });

    it("should return ids matching both ids and lastUpdatedAt filters", async () => {
      const recentConventionDraft: ConventionDraftDto = {
        ...conventionDraft,
        updatedAt: now,
      };
      const oldConventionDraft: ConventionDraftDto = {
        ...conventionDraft2,
        updatedAt: thirtyDaysAgo,
      };
      const oldConventionDraft2: ConventionDraftDto = {
        ...conventionDraft3,
        updatedAt: fourtyDaysAgo,
      };

      await pgConventionDraftRepository.save(recentConventionDraft, now);
      await pgConventionDraftRepository.save(oldConventionDraft, thirtyDaysAgo);
      await pgConventionDraftRepository.save(
        oldConventionDraft2,
        fourtyDaysAgo,
      );

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({
          ids: [recentConventionDraft.id, oldConventionDraft.id],
          lastUpdatedAt: new Date(thirtyDaysAgo),
        });

      expectToEqual(result, [oldConventionDraft.id]);
    });

    it("should return an empty array when no drafts match the filters", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({
          ids: [conventionDraft.id],
          lastUpdatedAt: new Date(thirtyDaysAgo),
        });

      expectToEqual(result, []);
    });

    it("should return an empty array when no drafts match lastUpdatedAt filter", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({
          lastUpdatedAt: new Date(thirtyDaysAgo),
        });

      expectToEqual(result, []);
    });

    it("should return an empty array when no drafts match ids filter", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);

      const nonExistingId = uuid();

      const result =
        await pgConventionDraftRepository.getConventionDraftIdsByFilters({
          ids: [nonExistingId],
        });

      expectToEqual(result, []);
    });
  });

  describe("delete", () => {
    it("deletes a convention draft", async () => {
      await pgConventionDraftRepository.save(conventionDraft, now);

      await pgConventionDraftRepository.delete([conventionDraft.id]);

      const result = await pgConventionDraftRepository.getById(
        conventionDraft.id,
      );
      expect(result).toBeUndefined();
    });

    it("do nothing when convention draft is not found", async () => {
      const nonExistentConventionDraftId = uuid();

      await pgConventionDraftRepository.save(conventionDraft, now);

      await expectToEqual(
        await pgConventionDraftRepository.getById(conventionDraft.id),
        { ...conventionDraft, updatedAt: now },
      );

      await pgConventionDraftRepository.delete([nonExistentConventionDraftId]);

      await expectToEqual(
        await pgConventionDraftRepository.getById(conventionDraft.id),
        { ...conventionDraft, updatedAt: now },
      );
    });
  });
});
