import { Pool, PoolClient } from "pg";
import { PgRomeRepository } from "../../adapters/secondary/pg/PgRomeRepository";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";

describe("Postgres implementation of Rome Gateway", () => {
  let pool: Pool;

  let client: PoolClient;
  let pgRomeRepository: PgRomeRepository;

  beforeAll(async () => {
    //We do not empty the data because the table data is static as it public data
    pool = getTestPgPool();
    client = await pool.connect();
    pgRomeRepository = new PgRomeRepository(client);
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

  describe("searchMetier", () => {
    it("Search of metier works", async () => {
      expect(await pgRomeRepository.searchMetier("boulangère")).toEqual([
        { codeMetier: "D1102", libelle: "Boulangerie - viennoiserie" },
      ]);
    });

    it("Correctly handles search queries with multiple words", async () => {
      expect(
        await pgRomeRepository.searchMetier("recherche en sciences"),
      ).toEqual([
        {
          codeMetier: "K2401",
          libelle: "Recherche en sciences de l'homme et de la société",
        },
        {
          codeMetier: "K2402",
          libelle:
            "Recherche en sciences de l'univers, de la matière et du vivant",
        },
      ]);
    });
  });

  describe("searchAppellation", () => {
    it("Conversion of appellation to ROME works", async () => {
      expect(await pgRomeRepository.searchAppellation("boulang")).toHaveLength(
        13,
      );

      expect(
        await pgRomeRepository.searchAppellation("Aide-boulanger"),
      ).toEqual([
        {
          codeAppellation: 10868,
          libelle: "Aide-boulanger / Aide-boulangère",
          codeMetier: "D1102",
        },
      ]);
    });

    it("Correctly handles search queries with multiple words", async () => {
      expect(await pgRomeRepository.searchAppellation("Chef de boule")).toEqual(
        [
          {
            codeAppellation: 12071,
            libelle: "Chef de boule",
            codeMetier: "G1206",
          },
          {
            codeAppellation: 12197,
            libelle: "Chef de partie de boule",
            codeMetier: "G1206",
          },
        ],
      );
    });
  });
});
