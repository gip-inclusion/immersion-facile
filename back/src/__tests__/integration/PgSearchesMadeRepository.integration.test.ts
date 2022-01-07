import { Pool, PoolClient } from "pg";
import {
  SearchMade,
  SearchMadeEntity,
} from "../../domain/immersionOffer/entities/SearchMadeEntity";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { PgSearchMadeRepository } from "../../adapters/secondary/pg/PgSearchMadeRepository";
import { SearchMadeEntityBuilder } from "../../_testBuilders/SearchMadeEntityBuilder";

describe("PgSearchesMadeRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgSearchesMadeRepository: PgSearchMadeRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE searches_made CASCADE; ");
    pgSearchesMadeRepository = new PgSearchMadeRepository(client);
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
  test("Retrieve pending searches", async () => {
    // Prepare : insert two entities : one already processed, the other not yet processed
    const entityNeedingToBeProcessed = new SearchMadeEntityBuilder()
      .withId("b0a81d02-6f07-11ec-90d6-0242ac120004")
      .build();
    const entityAlreadyProcessed = new SearchMadeEntityBuilder()
      .withId("ed2ca622-6f06-11ec-90d6-0242ac120006")
      .build();

    await insertEntity(entityNeedingToBeProcessed, true);
    await insertEntity(entityAlreadyProcessed, false);

    // Act : Retrieve unprocessed entities
    const retrievedSearches =
      await pgSearchesMadeRepository.retrievePendingSearches();

    // Assert
    expect(retrievedSearches).toHaveLength(1);
    expect(retrievedSearches[0].id).toEqual(entityNeedingToBeProcessed.id);
  });

  test("Mark search as processed", async () => {
    // Prepare : insert entity with needToBeProcessed flag to false
    const searchMadeId = "ed2ca622-6f06-11ec-90d6-0242ac120006";
    const searchMade = new SearchMadeEntityBuilder()
      .withId(searchMadeId)
      .build();
    await insertEntity(searchMade, true);
    // Act : call method
    pgSearchesMadeRepository.markSearchAsProcessed(searchMadeId);
    // Assert flag has been set to False
    const result = await client.query(
      `SELECT needsToBeSearched from searches_made WHERE id='${searchMadeId}';`,
    );
    expect(result.rows[0]).toEqual({ needstobesearched: false });
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

  const insertEntity = async (
    searchMade: SearchMadeEntity,
    needsToBeSearched: boolean,
  ) => {
    await client.query(
      `INSERT INTO searches_made (
       id, ROME, lat, lon, distance, needsToBeSearched, gps
     ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7));`,
      [
        searchMade.id,
        searchMade.rome,
        searchMade.lat,
        searchMade.lon,
        searchMade.distance_km,
        needsToBeSearched,
        `POINT(${searchMade.lon} ${searchMade.lat})`,
      ],
    );
  };
});
