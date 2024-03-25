import { uniq } from "ramda";
import { AppellationCode } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { SearchMadeEntity, SearchMadeId } from "../entities/SearchMadeEntity";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private transaction: KyselyDb) {}

  public async insertSearchMade(searchMade: SearchMadeEntity) {
    await this.#insertSearchMade(searchMade);

    if (searchMade.appellationCodes) {
      await this.#insertAppellationCodes(
        searchMade.id,
        searchMade.appellationCodes,
      );
    }
  }

  async #insertSearchMade(searchMade: SearchMadeEntity) {
    await this.transaction
      .insertInto("searches_made")
      .values({
        id: searchMade.id,
        rome: searchMade.romeCode,
        lat: searchMade.lat,
        lon: searchMade.lon,
        distance: searchMade.distanceKm,
        needstobesearched: searchMade.needsToBeSearched,
        gps: `POINT(${searchMade.lon} ${searchMade.lat})`,
        voluntary_to_immersion: searchMade.voluntaryToImmersion,
        api_consumer_name: searchMade.apiConsumerName,
        sorted_by: searchMade.sortedBy,
        address: searchMade.place,
        number_of_results: searchMade.numberOfResults,
        acquisition_keyword: searchMade.acquisitionKeyword,
        acquisition_campaign: searchMade.acquisitionCampaign,
      })
      .execute();
  }

  async #insertAppellationCodes(
    id: SearchMadeId,
    appellationCodes: AppellationCode[],
  ) {
    const uniqAppellationCodes = uniq(appellationCodes);

    await this.transaction
      .insertInto("searches_made__appellation_code")
      .values([
        ...uniqAppellationCodes.map((appellationCode) => ({
          search_made_id: id,
          appellation_code: appellationCode,
        })),
      ])
      .execute();
  }
}
