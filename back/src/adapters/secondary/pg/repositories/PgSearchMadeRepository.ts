import { SearchMadeEntity } from "../../../../domain/offer/entities/SearchMadeEntity";
import { SearchMadeRepository } from "../../../../domain/offer/ports/SearchMadeRepository";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private transaction: KyselyDb) {}

  public async insertSearchMade(searchMade: SearchMadeEntity) {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `INSERT INTO searches_made (
         id, ROME, lat, lon, distance, needsToBeSearched, gps, voluntary_to_immersion, api_consumer_name, sorted_by, address, appellation_code, number_of_results
       ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7), $8, $9, $10, $11, $12, $13)`,
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
        searchMade.numberOfResults,
      ],
    );
  }
}
