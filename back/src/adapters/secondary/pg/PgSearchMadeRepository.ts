import { PoolClient } from "pg";
import { SearchMadeEntity } from "../../../domain/offer/entities/SearchMadeEntity";
import { SearchMadeRepository } from "../../../domain/offer/ports/SearchMadeRepository";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private client: PoolClient) {}

  public async insertSearchMade(searchMade: SearchMadeEntity) {
    await this.client.query(
      `INSERT INTO searches_made (
         id, ROME, lat, lon, distance, needsToBeSearched, gps, voluntary_to_immersion, api_consumer_name, sorted_by, address, appellation_code
       ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7), $8, $9, $10, $11, $12)`,
      [
        searchMade.id,
        searchMade.romeCode, // soon : no need to store ROME as we now store appellation_code
        searchMade.lat,
        searchMade.lon,
        searchMade.distanceKm,
        searchMade.needsToBeSearched,
        `POINT(${searchMade.lon} ${searchMade.lat})`,
        searchMade.voluntaryToImmersion,
        searchMade.apiConsumerName,
        searchMade.sortedBy,
        searchMade.place,
        searchMade.appellationCode,
      ],
    );
  }
}
