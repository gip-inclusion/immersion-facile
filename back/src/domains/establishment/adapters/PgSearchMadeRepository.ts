import format from "pg-format";
import { uniq } from "ramda";
import { AppellationCode } from "shared";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
} from "../../../config/pg/kysely/kyselyUtils";
import { createLogger } from "../../../utils/logger";
import { SearchMadeEntity, SearchMadeId } from "../entities/SearchMadeEntity";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";

const logger = createLogger(__filename);

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private transaction: KyselyDb) {}

  public async insertSearchMade(searchMade: SearchMadeEntity) {
    const insertResult = await this.#insertSearchMade(searchMade);
    if (Number(insertResult.numAffectedRows) === 0) {
      logger.error("SearchMade not inserted in DB");
      return;
    }
    if (searchMade.appellationCodes) {
      await this.#insertAppellationCode(
        searchMade.id,
        searchMade.appellationCodes,
      );
    }
  }

  #insertSearchMade(searchMade: SearchMadeEntity) {
    return executeKyselyRawSqlQuery(
      this.transaction,
      `INSERT INTO searches_made (
         id, ROME, lat, lon, distance, needsToBeSearched, gps, voluntary_to_immersion, api_consumer_name, sorted_by, address, number_of_results
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
        searchMade.numberOfResults,
      ],
    );
  }

  #insertAppellationCode(
    id: SearchMadeId,
    appellationCodes: AppellationCode[],
  ) {
    const uniqAppellationCodes = uniq(appellationCodes);

    return executeKyselyRawSqlQuery(
      this.transaction,
      format(
        "INSERT INTO searches_made__appellation_code(search_made_id, appellation_code) VALUES %L",
        uniqAppellationCodes.map((appellationCode) => [id, appellationCode]),
      ),
    );
  }
}
