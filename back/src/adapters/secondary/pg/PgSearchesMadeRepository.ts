import { PoolClient } from "pg";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { createLogger } from "../../../utils/logger";
import { SearchesMadeRepository } from "./../../../domain/immersionOffer/ports/SearchesMadeRepository";

const logger = createLogger(__filename);

export class PgSearchesMadeRepository implements SearchesMadeRepository {
  constructor(private client: PoolClient) {}

  async insertSearchMade(searchParams: SearchParams) {
    await this.client.query(
      `INSERT INTO searches_made (
         ROME, lat, lon, distance, needsToBeSearched, gps
       ) VALUES ($1, $2, $3, $4, $5, ST_GeographyFromText($6))
       ON CONFLICT
         ON CONSTRAINT pk_searches_made
           DO UPDATE SET needstobesearched=true, update_date=NOW()`,
      [
        searchParams.rome,
        searchParams.lat,
        searchParams.lon,
        searchParams.distance_km,
        true,
        `POINT(${searchParams.lon} ${searchParams.lat})`,
      ],
    );
  }

  async markPendingSearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    // In order to lower the amount of request made to third-party services, after grouping by ROME
    // searched, we make an aggregation of the searches made in a radius of 0.3 degrees (=29.97 km)
    // and take the max distance searched.
    const searchesMade = await this.client.query(
      `SELECT
          requestGroupBy.rome as rome,
          requestGroupBy.max_distance AS distance_km,
          ST_Y(requestGroupBy.point) AS lat,
          ST_X(requestGroupBy.point) AS lon
       FROM (
          SELECT
            rome,
            MAX(distance) AS max_distance,
            ST_AsText(ST_GeometryN(unnest(ST_ClusterWithin(gps::geometry, 0.27)),1)) AS point
          FROM searches_made
          WHERE needstobesearched=true
          GROUP BY rome
        ) AS requestGroupBy`,
    );
    await this.client.query("UPDATE searches_made SET needstobesearched=false");
    return searchesMade.rows;
  }
}
