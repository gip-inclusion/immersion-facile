import { PoolClient } from "pg";
import {
  SearchMade,
  SearchMadeEntity,
} from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchesMadeRepository } from "./../../../domain/immersionOffer/ports/SearchesMadeRepository";

export class PgSearchesMadeRepository implements SearchesMadeRepository {
  constructor(private client: PoolClient) {}

  async insertSearchMade(searchMade: SearchMadeEntity) {
    await this.client.query(
      `INSERT INTO searches_made (
         id, ROME, lat, lon, distance, needsToBeSearched, gps
       ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7))`,
      [
        searchMade.id,
        searchMade.rome,
        searchMade.lat,
        searchMade.lon,
        searchMade.distance_km,
        true,
        `POINT(${searchMade.lon} ${searchMade.lat})`,
      ],
    );
  }

  async markPendingSearchesAsProcessedAndRetrieveThem(): Promise<SearchMade[]> {
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
