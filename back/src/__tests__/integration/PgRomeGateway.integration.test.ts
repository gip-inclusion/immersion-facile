import { Pool, PoolClient } from "pg";
import { PgRomeGateway } from "../../adapters/secondary/pg/PgRomeGateway";
import { RomeMetier } from "../../domain/rome/ports/RomeGateway";
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
  test("Conversion of appellation to ROME works", async () => {
    expect(await pgRomeGateway.appellationToCodeMetier("10200")).toBe("F1402");
  });

  test("Search of appellation works", async () => {
    const resultOfSearch: RomeMetier[] = [
      { codeMetier: "D1102", libelle: "Boulangerie - viennoiserie" },
    ];
    expect(await pgRomeGateway.searchMetier("boulangère")).toEqual(
      resultOfSearch,
    );
  });

  test("Conversion of appellation to ROME works", async () => {
    expect(await pgRomeGateway.searchAppellation("boulang")).toHaveLength(13);

    expect(
      (await pgRomeGateway.searchAppellation("Aide-boulanger"))[0].rome,
    ).toBe("D1102");
  });
});
