import { Pool, PoolClient } from "pg";
import { PgRomeGateway } from "../../adapters/secondary/pg/PgRomeGateway";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";

describe("Postgres implementation of Rome Gateway", () => {
  let pool: Pool;

  let client: PoolClient;
  let pgRomeGateway: PgRomeGateway;

  beforeAll(async () => {
    //We do not empty the data because the table data is static as it public data
    pool = getTestPgPool();
    client = await pool.connect();
    pgRomeGateway = new PgRomeGateway(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("appellationToCodeMetier", () => {
    test("Conversion of appellation to ROME works", async () => {
      expect(await pgRomeGateway.appellationToCodeMetier("10868")).toBe(
        "D1102",
      );
    });
  });

  describe("searchMetier", () => {
    test("Search of metier works", async () => {
      expect(await pgRomeGateway.searchMetier("boulangère")).toEqual([
        { codeMetier: "D1102", libelle: "Boulangerie - viennoiserie" },
      ]);
    });

    test("Correctly handles search queries with multiple words", async () => {
      expect(await pgRomeGateway.searchMetier("recherche en sciences")).toEqual(
        [
          {
            codeMetier: "K2401",
            libelle: "Recherche en sciences de l'homme et de la société",
          },
          {
            codeMetier: "K2402",
            libelle:
              "Recherche en sciences de l'univers, de la matière et du vivant",
          },
        ],
      );
    });
  });

  describe("searchAppellation", () => {
    test("Conversion of appellation to ROME works", async () => {
      expect(await pgRomeGateway.searchAppellation("boulang")).toHaveLength(13);

      expect(await pgRomeGateway.searchAppellation("Aide-boulanger")).toEqual([
        {
          codeAppellation: 10868,
          libelle: "Aide-boulanger / Aide-boulangère",
          codeMetier: "D1102",
        },
      ]);
    });

    test("Correctly handles search queries with multiple words", async () => {
      expect(await pgRomeGateway.searchAppellation("Chef de boule")).toEqual([
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
      ]);
      expect(
        await pgRomeGateway.searchAppellation("vendeur en habillement"),
      ).toEqual([
        {
          codeAppellation: 999001,
          libelle: "Vendeur / Vendeuse en habillement",
          codeMetier: "D1214",
        },
      ]);
    });
  });
});
