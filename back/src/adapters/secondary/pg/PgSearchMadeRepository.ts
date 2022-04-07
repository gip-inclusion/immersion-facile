import { PoolClient } from "pg";
import {
  SearchMadeEntity,
  SearchMadeId,
} from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchMadeRepository } from "../../../domain/immersionOffer/ports/SearchMadeRepository";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private client: PoolClient) {}

  async insertSearchMade(searchMade: SearchMadeEntity) {
    await this.client.query(
      `INSERT INTO searches_made (
         id, ROME, lat, lon, distance, needsToBeSearched, gps, voluntary_to_immersion, api_consumer_name
       ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7), $8, $9)`,
      [
        searchMade.id,
        searchMade.rome,
        searchMade.lat,
        searchMade.lon,
        searchMade.distance_km,
        true,
        `POINT(${searchMade.lon} ${searchMade.lat})`,
        searchMade.voluntary_to_immersion,
        searchMade.apiConsumerName,
      ],
    );
  }

  public async retrievePendingSearches(): Promise<SearchMadeEntity[]> {
    const requestResult = await this.client.query(
      "SELECT * from searches_made WHERE needstobesearched=true",
    );
    return requestResult.rows.map((row) => ({
      id: row.id,
      distance_km: row.distance,
      lat: row.lat,
      lon: row.lon,
      rome: row.rome,
      needsToBeSearched: row.needstobesearched,
    }));
  }
  public async markSearchAsProcessed(
    searchMadeId: SearchMadeId,
  ): Promise<void> {
    await this.client.query(
      "UPDATE searches_made SET needstobesearched=false WHERE id = $1 ; ",
      [searchMadeId],
    );
  }
}
