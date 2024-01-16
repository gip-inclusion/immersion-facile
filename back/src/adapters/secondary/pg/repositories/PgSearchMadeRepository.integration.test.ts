import { Pool, PoolClient } from "pg";
import { AppellationCode } from "shared";
import { SearchMadeEntity } from "../../../../domain/offer/entities/SearchMadeEntity";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool, optional } from "../pgUtils";
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
    const searchMadeResult = (
      await client.query<{
        id: string;
        distance: number;
        lat: number;
        lon: number;
        sorted_by?: "distance";
        voluntary_to_immersion?: boolean;
        address?: string;
        needstobesearched: boolean;
        api_consumer_name?: string;
        number_of_results?: number;
      }>("SELECT * FROM searches_made WHERE id=$1", [id])
    ).rows.at(0);

    const appellationCodes: AppellationCode[] = await client
      .query(
        "SELECT * FROM searches_made__appellation_code WHERE search_made_id=$1",
        [id],
      )
      .then(({ rows }) => rows.map(({ appellation_code }) => appellation_code));

    return (
      searchMadeResult && {
        id: searchMadeResult.id,
        distanceKm: searchMadeResult.distance,
        lat: searchMadeResult.lat,
        lon: searchMadeResult.lon,
        sortedBy: searchMadeResult.sorted_by,
        voluntaryToImmersion: searchMadeResult.voluntary_to_immersion,
        place: searchMadeResult.address,
        needsToBeSearched: searchMadeResult.needstobesearched,
        appellationCodes: optional(appellationCodes),
        apiConsumerName: optional(searchMadeResult.api_consumer_name),
        numberOfResults: optional(searchMadeResult.number_of_results) ?? 0,
      }
    );
  };
});
