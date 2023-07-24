import { Kysely } from "kysely";
import {
  SearchMadeEntity,
  SearchMadeId,
} from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchMadeRepository } from "../../../domain/immersionOffer/ports/SearchMadeRepository";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";
import { optional } from "./pgUtils";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  async insertSearchMade(searchMade: SearchMadeEntity) {
    const query = `
        INSERT INTO searches_made (id, ROME, lat, lon, distance,
                                   needsToBeSearched, gps, voluntary_to_immersion, api_consumer_name, sorted_by,
                                   address, appellation_code)
        VALUES ($1, $2, $3, $4, $5,
                $6, ST_GeographyFromText($7), $8, $9, $10,
                $11, $12)
    `;
    //prettier-ignore
    const {
      id,
      lat,
      lon,
      distanceKm,
      needsToBeSearched,
      voluntaryToImmersion,
      apiConsumerName,
      sortedBy,
      place,
      appellationCode
    } = searchMade
    //prettier-ignore
    const values = [
      id,
      null, // no need to store ROME as we now store appellation_code
      lat,
      lon,
      distanceKm,
      needsToBeSearched,
      `POINT(${lon} ${lat})`,
      voluntaryToImmersion,
      apiConsumerName,
      sortedBy,
      place,
      appellationCode,
    ];
    await executeKyselyRawSqlQuery(this.transaction, query, values);
  }

  public async markSearchAsProcessed(
    searchMadeId: SearchMadeId,
  ): Promise<void> {
    const query = `
        UPDATE searches_made
        SET needstobesearched= false
        WHERE id = $1;
    `;
    await executeKyselyRawSqlQuery(this.transaction, query, [searchMadeId]);
  }

  public async retrievePendingSearches(): Promise<SearchMadeEntity[]> {
    const query = `
        SELECT *
        FROM searches_made
        WHERE needstobesearched = true
    `;
    const requestResult = await executeKyselyRawSqlQuery(
      this.transaction,
      query,
    );
    return requestResult.rows.map(toSearchMadeEntity);
  }
}

const toSearchMadeEntity = (arg: any): SearchMadeEntity => ({
  id: arg.id,
  distanceKm: arg.distance,
  lat: arg.lat,
  lon: arg.lon,
  needsToBeSearched: arg.needstobesearched,
  sortedBy: arg.sorted_by,
  place: arg.address,
  appellationCode: optional(arg.appellation_code),
  apiConsumerName: optional(arg.api_consumer_name),
  voluntaryToImmersion: arg.voluntary_to_immersion,
});
