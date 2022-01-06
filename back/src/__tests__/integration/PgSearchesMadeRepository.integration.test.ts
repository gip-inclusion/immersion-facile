import { Pool, PoolClient } from "pg";
import { SearchMade } from "../../domain/immersionOffer/entities/SearchMadeEntity";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { PgSearchesMadeRepository } from "./../../adapters/secondary/pg/PgSearchesMadeRepository";

describe("PgSearchesMadeRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgSearchesMadeRepository: PgSearchesMadeRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE searches_made CASCADE");
    pgSearchesMadeRepository = new PgSearchesMadeRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  test("Insert search", async () => {
    await populateWithImmersionSearches();

    expect(
      (
        await lookupSearcheMade({
          rome: "M1607",
          distance_km: 30,
          lat: 49.119146,
          lon: 6.17602,
        })
      )[0].rome,
    ).toBe("M1607");
  });

  test("Grouping searches close geographically", async () => {
    await populateWithImmersionSearches();

    //We expect that two of the 6 searches have been grouped by
    expect(
      await pgSearchesMadeRepository.markPendingSearchesAsProcessedAndRetrieveThem(),
    ).toHaveLength(5);

    //We expect then that all searches have been retrieved
    expect(
      await pgSearchesMadeRepository.markPendingSearchesAsProcessedAndRetrieveThem(),
    ).toHaveLength(0);

    //We expect that all searches are not to be searched anymore
    const allSearches = (await getAllSearchesMade()).rows;
    allSearches.map((row) => {
      expect(row.needstobesearched).toBe(false);
    });
  });

  const populateWithImmersionSearches = async () => {
    await pgSearchesMadeRepository.insertSearchMade({
      id: "9f6da868-6f02-11ec-90d6-0242ac120003",
      rome: "M1607",
      distance_km: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    await pgSearchesMadeRepository.insertSearchMade({
      id: "9f6daac0-6f02-11ec-90d6-0242ac120003",
      rome: "M1607",
      distance_km: 30,
      lat: 48.119146,
      lon: 6.17602,
    });
    await pgSearchesMadeRepository.insertSearchMade({
      id: "9f6dac00-6f02-11ec-90d6-0242ac120003",
      rome: "M1607",
      distance_km: 30,
      lat: 48.119146,
      lon: 5.17602,
    });
    await pgSearchesMadeRepository.insertSearchMade({
      id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
      rome: "M1607",
      distance_km: 30,
      lat: 48.119146,
      lon: 4.17602,
    });
    await pgSearchesMadeRepository.insertSearchMade({
      id: "9f6dae4e-6f02-11ec-90d6-0242ac120003",
      rome: "M1607",
      distance_km: 30,
      lat: 48.129146,
      lon: 4.17602,
    });
    await pgSearchesMadeRepository.insertSearchMade({
      id: "bee68ce6-6f02-11ec-90d6-0242ac120003",
      rome: "M1608",
      distance_km: 30,
      lat: 48.129146,
      lon: 4.17602,
    });
  };

  const lookupSearcheMade = async (searchMade: SearchMade) => {
    const res = await client.query(
      "SELECT * FROM searches_made WHERE rome=$1 AND lat=$2 AND lon=$3 AND distance=$4",
      [searchMade.rome, searchMade.lat, searchMade.lon, searchMade.distance_km],
    );
    return res.rows;
  };

  const getAllSearchesMade = async () =>
    await client.query("SELECT * FROM searches_made");
});
