import { Pool, PoolClient } from "pg";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { PgLaBonneBoiteRequestRepository } from "../../adapters/secondary/pg/PgLaBonneBoiteRequestRepository";
import { LaBonneBoiteRequestEntity } from "../../domain/immersionOffer/entities/LaBonneBoiteRequestEntity";
import { LaBonneBoiteRequestParams } from "../../domain/immersionOffer/ports/LaBonneBoiteAPI";

describe("PgLaBonneBoiteRequestRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let repo: PgLaBonneBoiteRequestRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM lbb_requests");
    repo = new PgLaBonneBoiteRequestRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Insert LBB request with defined rome", async () => {
    const entity: LaBonneBoiteRequestEntity = {
      params: { rome: "F1111", distance_km: 30, lon: 3.1, lat: 88.1 },
      result: {
        error: null,
        number0fEstablishments: 6,
        numberOfRelevantEstablishments: 9,
      },
      requestedAt: new Date(2024),
    };
    await repo.insertLaBonneBoiteRequest(entity);

    const allRows = await getAllRows();
    expect(allRows).toHaveLength(1);
    expect(allRows[0]).toEqual({
      ...entity.params,
      result: entity.result,
      requested_at: entity.requestedAt,
    });
  });

  // Some LatLon DTO
  // ----------------
  // Distance between those DTO
  // Paris17 <-> Paris10 ~= 6km
  // Paris17 <-> Evry ~= 31km

  const paris10: GeoPositionDto = {
    lat: 48.8841446, // 169 Bd de la Villette, 75010 Paris
    lon: 2.3651789,
  };

  const paris17: GeoPositionDto = {
    lat: 48.862725, // 7 rue guillaume Tell, 75017 Paris
    lon: 2.287592,
  };

  const evry: GeoPositionDto = {
    lat: 48.5961, // Ikea Evry
    lon: 2.4406,
  };

  describe("Get closest request params with this rome since", () => {
    const thisRome = "F1111";
    const thisPosition = paris17;
    const thisDate = new Date("2020-01-07T00:00:00");
    const getDateBefore = (time = "00") => new Date(`2020-01-06T${time}:00:00`);
    const getDateAfter = (time = "00") => new Date(`2020-01-08T${time}:00:00`);

    it("Should return null if the given rome has not been requested since the given date", async () => {
      // Prepare
      const dateBefore = getDateBefore();
      await insertEntity(dateBefore, paris17, thisRome);
      // Act
      const closestRequestAndDistance =
        await repo.getClosestRequestParamsWithThisRomeSince({
          rome: thisRome,
          position: thisPosition,
          since: thisDate,
        });
      // Assert
      expect(closestRequestAndDistance).toBeNull();
    });

    it("Should return closest (geographicaly) made request with the  given rome since the given date", async () => {
      // Prepare
      await insertEntity(getDateAfter("08"), paris10, thisRome, 100); // Same rome, 6km away (our match !)
      await insertEntity(getDateAfter("09"), paris17, "F2222"); //  Not same rome, 0km away
      await insertEntity(getDateAfter("10"), evry, thisRome); // Same rome, 31km away
      await insertEntity(getDateBefore(), paris17, thisRome); //  Same rome, 0km away, but before the given date

      // Act
      const closestRequestAndDistance =
        await repo.getClosestRequestParamsWithThisRomeSince({
          rome: thisRome,
          position: thisPosition,
          since: thisDate,
        });
      const expectedPartialParams: LaBonneBoiteRequestParams = {
        lon: paris10.lon,
        lat: paris10.lat,
        rome: thisRome,
        distance_km: 100,
      };
      expect(closestRequestAndDistance).not.toBeNull();
      expect(closestRequestAndDistance?.params).toEqual(expectedPartialParams);
      expect(closestRequestAndDistance?.distanceToPositionKm).toBeCloseTo(6, 0);
    });
  });
  const getAllRows = async () =>
    (await client.query("SELECT * FROM lbb_requests")).rows;

  const insertEntity = async (
    requestedAt: Date,
    position: GeoPositionDto,
    rome: string,
    distanceKm = 10,
  ) => {
    await client.query(
      `INSERT INTO lbb_requests (
       requested_at, rome, lat, lon, distance_km, result) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        requestedAt.toISOString(),
        rome,
        position.lat,
        position.lon,
        distanceKm,
        {},
      ],
    );
  };
});
