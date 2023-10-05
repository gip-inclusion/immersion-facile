import { Pool, PoolClient } from "pg";
import { AppellationCode } from "shared";
import { getTestPgPool } from "../../../../_testBuilders/getTestPgPool";
import { SearchMadeEntity } from "../../../../domain/offer/entities/SearchMadeEntity";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { optional } from "../pgUtils";
import { PgSearchMadeRepository } from "./PgSearchMadeRepository";

describe("PgSearchesMadeRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgSearchesMadeRepository: PgSearchMadeRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM searches_made");
    pgSearchesMadeRepository = new PgSearchMadeRepository(makeKyselyDb(pool));
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Insert search", async () => {
    const searchMade: SearchMadeEntity = {
      id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
      appellationCodes: ["19365"],
      distanceKm: 30,
      lat: 48.119146,
      lon: 4.17602,
      needsToBeSearched: true,
      sortedBy: "distance",
      place: "Nantes",
      voluntaryToImmersion: true,
      numberOfResults: 1,
    };
    await pgSearchesMadeRepository.insertSearchMade(searchMade);
    const retrievedSearchMade = await getSearchMadeById(searchMade.id);
    expect(retrievedSearchMade).toEqual(searchMade);
  });

  const getSearchMadeById = async (
    id: string,
  ): Promise<SearchMadeEntity | undefined> => {
    const res = await client.query("SELECT * FROM searches_made WHERE id=$1", [
      id,
    ]);
    const appellationCodes: AppellationCode[] = await client
      .query(
        "SELECT * FROM searches_made__appellation_code WHERE search_made_id=$1",
        [id],
      )
      .then(({ rows }) => rows.map(({ appellation_code }) => appellation_code));
    if (res.rows.length === 0) return;
    return {
      id: res.rows[0].id,
      distanceKm: res.rows[0].distance,
      lat: res.rows[0].lat,
      lon: res.rows[0].lon,
      sortedBy: res.rows[0].sorted_by,
      voluntaryToImmersion: res.rows[0].voluntary_to_immersion,
      place: res.rows[0].address,
      needsToBeSearched: res.rows[0].needstobesearched,
      appellationCodes: optional(appellationCodes),
      apiConsumerName: optional(res.rows[0].api_consumer_name),
      numberOfResults: optional(res.rows[0].number_of_results),
    };
  };
});
