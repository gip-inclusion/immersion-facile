import { Pool } from "pg";
import { AppellationCode, expectToEqual } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool, optional } from "../../../config/pg/pgUtils";
import { GeoParams, SearchMadeEntity } from "../entities/SearchMadeEntity";
import { PgSearchMadeRepository } from "./PgSearchMadeRepository";

describe("PgSearchesMadeRepository", () => {
  const searchMadeWithoutLocation: SearchMadeEntity = {
    id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
    needsToBeSearched: true,
    sortedBy: "distance",
    place: "Nantes",
    voluntaryToImmersion: true,
    numberOfResults: 1,
  };

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

  describe("with geo params", () => {
    it.each<GeoParams & { expectedDepartmentCode: string }>([
      {
        distanceKm: 30,
        lat: 48.85909,
        lon: 2.350196,
        expectedDepartmentCode: "75",
      },
      {
        distanceKm: 2,
        lat: 47.22221,
        lon: -1.54212,
        expectedDepartmentCode: "44",
      },
      {
        distanceKm: 3.2,
        lat: 46.159457943708254,
        lon: 0.15399270230344264,
        expectedDepartmentCode: "86",
      },
      {
        distanceKm: 9,
        lat: 46.15944708515133,
        lon: 0.15392947992255213,
        expectedDepartmentCode: "79",
      },
      {
        distanceKm: 9,
        lat: -21.154576445369,
        lon: 55.40104947929245,
        expectedDepartmentCode: "974",
      },
    ])(
      "insert a search made with geo params (lat '$lat' , lon '$lon' , '$distanceKm' km) and save departement code with value '$expectedDepartmentCode'",
      async ({ distanceKm, lat, lon, expectedDepartmentCode }) => {
        const searchMadeWithLocation: SearchMadeEntity = {
          ...searchMadeWithoutLocation,
          distanceKm,
          lat,
          lon,
        };

        await pgSearchesMadeRepository.insertSearchMade(searchMadeWithLocation);

        expectToEqual(
          await getSearchMadeById(db, searchMadeWithLocation.id),
          searchMadeWithLocation,
        );
        expectToEqual(
          await db
            .selectFrom("searches_made")
            .select("department_code")
            .where("id", "=", searchMadeWithLocation.id)
            .executeTakeFirst(),
          { department_code: expectedDepartmentCode },
        );
      },
    );
  });

  it("insert a search made without location and have departement code null", async () => {
    await pgSearchesMadeRepository.insertSearchMade(searchMadeWithoutLocation);

    expectToEqual(
      await getSearchMadeById(db, searchMadeWithoutLocation.id),
      searchMadeWithoutLocation,
    );
    expectToEqual(
      await db
        .selectFrom("searches_made")
        .select("department_code")
        .where("id", "=", searchMadeWithoutLocation.id)
        .executeTakeFirst(),
      { department_code: null },
    );
  });

  it("insert a search made and keeps acquisition params", async () => {
    const searchMade: SearchMadeEntity = {
      ...searchMadeWithoutLocation,
      acquisitionKeyword: "acquisition-keyword",
      acquisitionCampaign: "acquisition-campaign",
    };

    await pgSearchesMadeRepository.insertSearchMade(searchMade);

    expectToEqual(await getSearchMadeById(db, searchMade.id), searchMade);
  });

  it("Remove duplicated appellationCodes then insert search", async () => {
    const appellationCode: AppellationCode = "19365";

    const searchMade: SearchMadeEntity = {
      ...searchMadeWithoutLocation,
      appellationCodes: [appellationCode, appellationCode],
    };

    await pgSearchesMadeRepository.insertSearchMade(searchMade);

    expectToEqual(await getSearchMadeById(db, searchMade.id), {
      ...searchMade,
      appellationCodes: [appellationCode],
    });
  });
});

const getSearchMadeById = async (
  db: KyselyDb,
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
      distanceKm: optional(searchMadeResult.distance),
      lat: optional(searchMadeResult.lat),
      lon: optional(searchMadeResult.lon),
      sortedBy: optional(searchMadeResult.sorted_by),
      voluntaryToImmersion: optional(searchMadeResult.voluntary_to_immersion),
      place: optional(searchMadeResult.address),
      needsToBeSearched: searchMadeResult.needstobesearched ?? false,
      appellationCodes: appellationCodes.length ? appellationCodes : undefined,
      apiConsumerName: optional(searchMadeResult.api_consumer_name),
      numberOfResults: optional(searchMadeResult.number_of_results) ?? 0,
      acquisitionCampaign: optional(searchMadeResult.acquisition_campaign),
      acquisitionKeyword: optional(searchMadeResult.acquisition_keyword),
      establishmentSearchableBy: optional(searchMadeResult.searchable_by),
    }
  );
};
