import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { makeKyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { PgRomeRepository } from "./PgRomeRepository";

describe("Postgres implementation of Rome Gateway", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgRomeRepository: PgRomeRepository;

  beforeAll(async () => {
    //We do not empty the data because the table data is static as it public data
    pool = getTestPgPool();
    client = await pool.connect();
    pgRomeRepository = new PgRomeRepository(makeKyselyDb(pool));
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("appellationToCodeMetier", () => {
    it("Conversion of appellation to ROME works", async () => {
      expect(await pgRomeRepository.appellationToCodeMetier("10868")).toBe(
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

  describe("searchRome", () => {
    it("Searches match in appellation and returns distinct rome", async () => {
      expect(await pgRomeRepository.searchRome("boulangere")).toEqual([
        { romeCode: "D1102", romeLabel: "Boulangerie - viennoiserie" },
      ]);
    });

    it("Searches match in rome and returns distinct rome", async () => {
      expect((await pgRomeRepository.searchRome("boulangerie"))[0]).toEqual({
        romeCode: "D1102",
        romeLabel: "Boulangerie - viennoiserie",
      });
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
    });
  });
});
