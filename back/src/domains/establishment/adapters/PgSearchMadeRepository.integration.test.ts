import { Pool } from "pg";
import {
  AppellationCode,
  WithAcquisition,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool, optional } from "../../../config/pg/pgUtils";
import { SearchMadeEntity } from "../entities/SearchMadeEntity";
import { PgSearchMadeRepository } from "./PgSearchMadeRepository";

const defaultSearchMade: SearchMadeEntity = {
  id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
  distanceKm: 30,
  lat: 48.119146,
  lon: 4.17602,
  needsToBeSearched: true,
  sortedBy: "distance",
  place: "Nantes",
  voluntaryToImmersion: true,
  numberOfResults: 1,
};

describe("PgSearchesMadeRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgSearchesMadeRepository: PgSearchMadeRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("searches_made__appellation_code").execute();
    await db.deleteFrom("searches_made").execute();
    pgSearchesMadeRepository = new PgSearchMadeRepository(makeKyselyDb(pool));
  });

  afterAll(async () => {
    await pool.end();
  });

  it("insert a search made", async () => {
    await pgSearchesMadeRepository.insertSearchMade(defaultSearchMade);
    const retrievedSearchMade = await getSearchMadeById(defaultSearchMade.id);
    expectToEqual(retrievedSearchMade, defaultSearchMade);
  });

  it("insert a search made and keeps acquisition params", async () => {
    const withAcquisition = {
      acquisitionKeyword: "acquisition-keyword",
      acquisitionCampaign: "acquisition-campaign",
    } satisfies WithAcquisition;
    await pgSearchesMadeRepository.insertSearchMade({
      ...defaultSearchMade,
      ...withAcquisition,
    });

    const results = await db.selectFrom("searches_made").selectAll().execute();

    expect(results).toHaveLength(1);
    expectObjectsToMatch(results[0], {
      id: defaultSearchMade.id,
      acquisition_keyword: withAcquisition.acquisitionKeyword,
      acquisition_campaign: withAcquisition.acquisitionCampaign,
    });
  });

  it("Remove duplicated appellationCodes then insert search", async () => {
    const appellationCodes: AppellationCode[] = ["19365", "19365"];
    const searchMade: SearchMadeEntity = {
      id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
      appellationCodes,
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

    expect(retrievedSearchMade).toEqual({
      ...searchMade,
      appellationCodes: [appellationCodes[0]],
    });
  });

  const getSearchMadeById = async (
    id: string,
  ): Promise<SearchMadeEntity | undefined> => {
    const searchMadeResult = await db
      .selectFrom("searches_made")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    const appellationCodes: AppellationCode[] = await db
      .selectFrom("searches_made__appellation_code")
      .selectAll()
      .where("search_made_id", "=", id)
      .execute()
      .then((rows) =>
        rows
          .map(({ appellation_code }) => appellation_code)
          .filter(
            (appellationCode): appellationCode is AppellationCode =>
              appellationCode !== null,
          ),
      );

    return (
      searchMadeResult && {
        id: searchMadeResult.id,
        distanceKm: searchMadeResult.distance,
        lat: searchMadeResult.lat,
        lon: searchMadeResult.lon,
        sortedBy: optional(searchMadeResult.sorted_by),
        voluntaryToImmersion: optional(searchMadeResult.voluntary_to_immersion),
        place: optional(searchMadeResult.address),
        needsToBeSearched: searchMadeResult.needstobesearched ?? false,
        appellationCodes: appellationCodes.length
          ? appellationCodes
          : undefined,
        apiConsumerName: optional(searchMadeResult.api_consumer_name),
        numberOfResults: optional(searchMadeResult.number_of_results) ?? 0,
      }
    );
  };
});
