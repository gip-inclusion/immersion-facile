import { Pool, PoolClient } from "pg";

import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { SearchMadeEntityBuilder } from "../../../_testBuilders/SearchMadeEntityBuilder";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";

import { PgSearchMadeRepository } from "./PgSearchMadeRepository";
import { optional } from "./pgUtils";

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
    pgSearchesMadeRepository = new PgSearchMadeRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Insert search", async () => {
    const searchMade: SearchMadeEntity = {
      id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
      rome: "M1607",
      appellationCode: "19365",
      distance_km: 30,
      lat: 48.119146,
      lon: 4.17602,
      needsToBeSearched: true,
      sortedBy: "distance",
      place: "Nantes",
      voluntaryToImmersion: true,
    };
    await pgSearchesMadeRepository.insertSearchMade(searchMade);
    const retrievedSearchMade = await getSearchMadeById(searchMade.id);
    expect(retrievedSearchMade).toEqual(searchMade);
  });
  it("Retrieve pending searches", async () => {
    // Prepare : insert two entities : one already processed, the other not yet processed
    const entityNeedingToBeProcessed = new SearchMadeEntityBuilder()
      .withId("b0a81d02-6f07-11ec-90d6-0242ac120004")
      .withNeedsToBeSearch()
      .build();
    const entityAlreadyProcessed = new SearchMadeEntityBuilder()
      .withId("ed2ca622-6f06-11ec-90d6-0242ac120006")
      .build();

    await pgSearchesMadeRepository.insertSearchMade(entityNeedingToBeProcessed);
    await pgSearchesMadeRepository.insertSearchMade(entityAlreadyProcessed);

    // Act : Retrieve unprocessed entities
    const retrievedSearches =
      await pgSearchesMadeRepository.retrievePendingSearches();

    // Assert
    expect(retrievedSearches).toHaveLength(1);
    expect(retrievedSearches[0]).toMatchObject(entityNeedingToBeProcessed);
  });

  it("Mark search as processed", async () => {
    // Prepare : insert entity with needToBeProcessed flag to false
    const searchMadeId = "ed2ca622-6f06-11ec-90d6-0242ac120006";
    const searchMade = new SearchMadeEntityBuilder()
      .withId(searchMadeId)
      .withNeedsToBeSearch()
      .build();
    await pgSearchesMadeRepository.insertSearchMade(searchMade);
    // Act : call method
    await pgSearchesMadeRepository.markSearchAsProcessed(searchMadeId);
    // Assert flag has been set to False
    const result = await client.query(
      `SELECT needsToBeSearched from searches_made WHERE id='${searchMadeId}';`,
    );
    expect(result.rows[0]).toEqual({ needstobesearched: false });
  });

  const getSearchMadeById = async (
    id: string,
  ): Promise<SearchMadeEntity | undefined> => {
    const res = await client.query("SELECT * FROM searches_made WHERE id=$1", [
      id,
    ]);
    if (res.rows.length === 0) return;
    return {
      id: res.rows[0].id,
      rome: optional(res.rows[0].rome),
      distance_km: res.rows[0].distance,
      lat: res.rows[0].lat,
      lon: res.rows[0].lon,
      sortedBy: res.rows[0].sorted_by,
      voluntaryToImmersion: res.rows[0].voluntary_to_immersion,
      place: res.rows[0].address,
      needsToBeSearched: res.rows[0].needstobesearched,
      appellationCode: optional(res.rows[0].appellation_code),
      apiConsumerName: optional(res.rows[0].api_consumer_name),
    };
  };
});
