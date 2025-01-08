import { Pool } from "pg";
import { expectToEqual } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { PgRomeRepository } from "./PgRomeRepository";

describe("Postgres implementation of Rome Gateway", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgRomeRepository: PgRomeRepository;

  beforeAll(async () => {
    //We do not empty the data because the table data is static as it public data
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgRomeRepository = new PgRomeRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("appellationToCodeMetier", () => {
    it("Conversion of appellation to ROME works", async () => {
      expectToEqual(
        await pgRomeRepository.appellationToCodeMetier("10868"),
        "D1102",
      );
    });
  });

  describe("getFullAppellationsFromCodes", () => {
    it("gets Appellations DTOs when providing the codes", async () => {
      expectToEqual(
        await pgRomeRepository.getAppellationAndRomeDtosFromAppellationCodes([
          "10868",
          "12694",
        ]),
        [
          {
            appellationCode: "10868",
            appellationLabel: "Aide-boulanger / Aide-boulangère",
            romeCode: "D1102",
            romeLabel: "Boulangerie - viennoiserie",
          },
          {
            appellationCode: "12694",
            appellationLabel: "Coiffeur / Coiffeuse mixte",
            romeCode: "D1202",
            romeLabel: "Coiffure",
          },
        ],
      );
    });
  });

  describe("getAppellationAndRomeLegacyV3", () => {
    it("gets undefined when the legacy_rome_code_v3 is not provided", async () => {
      const appellationAndRomeV3 =
        await pgRomeRepository.getAppellationAndRomeLegacyV3("38745");
      expectToEqual(appellationAndRomeV3, undefined);
    });

    it("gets the AppellationAndRomeCode for legacy ROME 3 when it exists", async () => {
      const devMobileAppellationCode = "38745";
      await db
        .updateTable("public_appellations_data")
        .set({
          legacy_code_rome_v3: "M1804", // pour l'exemple, c'est pas un rome v3
        })
        .where("ogr_appellation", "=", +devMobileAppellationCode)
        .execute();

      const appellationAndRomeV3 =
        await pgRomeRepository.getAppellationAndRomeLegacyV3(
          devMobileAppellationCode,
        );
      expectToEqual(appellationAndRomeV3, {
        appellationCode: devMobileAppellationCode,
        appellationLabel: "Développeur / Développeuse web mobile",
        romeCode: "M1804",
        romeLabel: "Études et développement de réseaux de télécoms",
      });

      await db
        .updateTable("public_appellations_data")
        .set({ legacy_code_rome_v3: null })
        .where("ogr_appellation", "=", +devMobileAppellationCode)
        .execute();
    });
  });

  describe("searchRome", () => {
    it("Searches match in appellation and returns distinct rome", async () => {
      expectToEqual(await pgRomeRepository.searchRome("boulangere"), [
        { romeCode: "D1102", romeLabel: "Boulangerie - viennoiserie" },
      ]);
    });

    it("Searches match in rome and returns distinct rome", async () => {
      expectToEqual(await pgRomeRepository.searchRome("boulangerie"), [
        {
          romeCode: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
        },
        {
          romeCode: "D1106",
          romeLabel: "Vente en alimentation",
        },
        {
          romeCode: "D1502",
          romeLabel: "Management/gestion de rayon produits alimentaires",
        },
        {
          romeCode: "D1507",
          romeLabel: "Mise en rayon libre-service",
        },
        {
          romeCode: "H2102",
          romeLabel: "Conduite d'équipement de production alimentaire",
        },
      ]);
    });

    it("Correctly handles search queries with multiple words", async () => {
      expect(
        await pgRomeRepository.searchRome("recherche en sciences humaines"),
      ).toEqual([
        {
          romeCode: "K2401",
          romeLabel: "Recherche en sciences de l'homme et de la société",
        },
      ]);
    });

    it("Correctly handles when two spaces are typed", async () => {
      expect(
        await pgRomeRepository.searchRome("recherche en sciences  humaines"),
      ).toEqual([
        {
          romeCode: "K2401",
          romeLabel: "Recherche en sciences de l'homme et de la société",
        },
      ]);
    });
  });

  describe("searchAppellation", () => {
    it("Conversion of appellation to ROME works", async () => {
      expect(await pgRomeRepository.searchAppellation("boulang")).toHaveLength(
        13,
      );

      expectToEqual(
        await pgRomeRepository.searchAppellation("Aide-boulangère"),
        [
          {
            appellationCode: "10868",
            appellationLabel: "Aide-boulanger / Aide-boulangère",
            romeCode: "D1102",
            romeLabel: "Boulangerie - viennoiserie",
          },
        ],
      );
    });

    it("Correctly handles search queries with multiple words", async () => {
      expectToEqual(await pgRomeRepository.searchAppellation("Chef de boule"), [
        {
          appellationCode: "12071",
          appellationLabel: "Chef de boule",
          romeCode: "G1206",
          romeLabel: "Personnel technique des jeux",
        },
        {
          appellationCode: "12197",
          appellationLabel: "Chef de partie de boule",
          romeCode: "G1206",
          romeLabel: "Personnel technique des jeux",
        },
      ]);
    });

    it("Correctly handles search queries with several words and should be accent insensitive", async () => {
      expectToEqual(
        await pgRomeRepository.searchAppellation("prêt-a-porter enfant"),
        [
          {
            appellationCode: "20614",
            appellationLabel: "Vendeur / Vendeuse en prêt-à-porter enfant",
            romeCode: "D1214",
            romeLabel: "Vente en habillement et accessoires de la personne",
          },
        ],
      );
    });

    it("should handle correctly special characters", async () => {
      expectToEqual(await pgRomeRepository.searchAppellation("produit d'ass"), [
        {
          appellationCode: "12338",
          appellationLabel: "Chef de segment produits d'assurances",
          romeCode: "C1101",
          romeLabel: "Conception - développement produits d'assurances",
        },
        {
          appellationCode: "12823",
          appellationLabel:
            "Concepteur développeur / Conceptrice développeuse de produits d'assurances",
          romeCode: "C1101",
          romeLabel: "Conception - développement produits d'assurances",
        },
      ]);

      expectToEqual(
        await pgRomeRepository.searchAppellation("musicothérap:eute"),
        [
          {
            appellationCode: "16942",
            appellationLabel: "Musicothérapeute",
            romeCode: "K1104",
            romeLabel: "Psychologie",
          },
        ],
      );

      expectToEqual(
        await pgRomeRepository.searchAppellation("'musicothérapeute"),
        [
          {
            appellationCode: "16942",
            appellationLabel: "Musicothérapeute",
            romeCode: "K1104",
            romeLabel: "Psychologie",
          },
        ],
      );

      expectToEqual(
        await pgRomeRepository.searchAppellation("''''musicothérapeute"),
        [
          {
            appellationCode: "16942",
            appellationLabel: "Musicothérapeute",
            romeCode: "K1104",
            romeLabel: "Psychologie",
          },
        ],
      );

      expectToEqual(
        await pgRomeRepository.searchAppellation("musicothérapeute''''"),
        [
          {
            appellationCode: "16942",
            appellationLabel: "Musicothérapeute",
            romeCode: "K1104",
            romeLabel: "Psychologie",
          },
        ],
      );

      expectToEqual(await pgRomeRepository.searchAppellation("musicoth&"), [
        {
          appellationCode: "16942",
          appellationLabel: "Musicothérapeute",
          romeCode: "K1104",
          romeLabel: "Psychologie",
        },
      ]);

      expectToEqual(
        await pgRomeRepository.searchAppellation(
          "Directeur / Directrice 'entreprise ou de Service d'Aide par le Travail -ESAT-",
        ),
        [
          {
            appellationCode: "14354",
            appellationLabel:
              "Directeur / Directrice d'entreprise ou de Service d'Aide par le Travail -ESAT-",
            romeCode: "K1403",
            romeLabel:
              "Management de structure de santé, sociale ou pénitentiaire",
          },
        ],
      );
      expectToEqual(
        await pgRomeRepository.searchAppellation(
          "Directeur / 'Directrice 'entreprise ou de Service d'Aide par le Travail -ESAT-' ",
        ),
        [
          {
            appellationCode: "14354",
            appellationLabel:
              "Directeur / Directrice d'entreprise ou de Service d'Aide par le Travail -ESAT-",
            romeCode: "K1403",
            romeLabel:
              "Management de structure de santé, sociale ou pénitentiaire",
          },
        ],
      );
    });
  });
});
