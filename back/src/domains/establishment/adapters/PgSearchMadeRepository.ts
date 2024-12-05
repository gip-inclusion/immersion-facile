import { sql } from "kysely";
import { uniq } from "ramda";
import { AppellationCode } from "shared";
import { KyselyDb, values } from "../../../config/pg/kysely/kyselyUtils";
import {
  SearchMadeEntity,
  SearchMadeId,
  hasSearchMadeGeoParams,
} from "../entities/SearchMadeEntity";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private transaction: KyselyDb) {}

  public async insertSearchMade(searchMade: SearchMadeEntity) {
    await this.#insertSearchMade(searchMade);

    if (searchMade.appellationCodes && searchMade.appellationCodes.length > 0) {
      await this.#insertAppellationCodes(
        searchMade.id,
        searchMade.appellationCodes,
      );
    }
  }

  async #insertSearchMade(searchMade: SearchMadeEntity) {
    await this.transaction
      .insertInto("searches_made")
      .columns([
        "acquisition_campaign",
        "acquisition_keyword",
        "address",
        "api_consumer_name",
        "department_code",
        "distance",
        "gps",
        "id",
        "lat",
        "lon",
        "needstobesearched",
        "number_of_results",
        "rome",
        "searchable_by",
        "sorted_by",
        "voluntary_to_immersion",
      ])
      .expression((eb) =>
        eb
          .selectFrom(
            values(
              [
                {
                  id: searchMade.id,
                  rome: searchMade.romeCode,
                  needstobesearched: searchMade.needsToBeSearched,
                  voluntary_to_immersion: searchMade.voluntaryToImmersion,
                  api_consumer_name: searchMade.apiConsumerName,
                  sorted_by: searchMade.sortedBy,
                  address: searchMade.place,
                  number_of_results: searchMade.numberOfResults,
                  searchable_by: searchMade.establishmentSearchableBy,
                  acquisition_keyword: searchMade.acquisitionKeyword,
                  acquisition_campaign: searchMade.acquisitionCampaign,
                  ...(hasSearchMadeGeoParams(searchMade)
                    ? {
                        lat: searchMade.lat,
                        lon: searchMade.lon,
                        distance: searchMade.distanceKm,
                        gps: `POINT(${searchMade.lon} ${searchMade.lat})`,
                      }
                    : {
                        lat: null,
                        lon: null,
                        distance: null,
                        gps: null,
                      }),
                },
              ],
              "values",
            ),
          )
          .leftJoin("public_department_region", (join) =>
            join.on((eb) =>
              eb.and([
                eb("values.gps", "is not", null),
                eb.fn<boolean>("ST_DWithin", [
                  "public_department_region.shape",
                  sql`${eb.ref("values.gps")}::geography`,
                  sql`0`,
                ]),
              ]),
            ),
          )
          .select((eb) => [
            "values.acquisition_campaign",
            "values.acquisition_keyword",
            "values.address",
            "values.api_consumer_name",
            "public_department_region.department_code",
            eb.fn
              .coalesce(
                sql`${eb.ref("values.distance")}::double precision`,
                sql`NULL`,
              )
              .as("distance"),
            eb.fn
              .coalesce(sql`${eb.ref("values.gps")}::geography`, sql`NULL`)
              .as("gps"),
            sql`${eb.ref("values.id")}::uuid`.as("id"),
            eb.fn
              .coalesce(
                sql`${eb.ref("values.lat")}::double precision`,
                sql`NULL`,
              )
              .as("lat"),
            eb.fn
              .coalesce(
                sql`${eb.ref("values.lon")}::double precision`,
                sql`NULL`,
              )
              .as("lon"),
            eb.fn
              .coalesce(
                sql`${eb.ref("values.needstobesearched")}::boolean`,
                sql`NULL`,
              )
              .as("needstobesearched"),
            eb.fn
              .coalesce(
                sql`${eb.ref("values.number_of_results")}::integer`,
                sql`NULL`,
              )
              .as("number_of_results"),
            "values.rome",
            eb.fn
              .coalesce(
                sql`${eb.ref("values.searchable_by")}::searchable_by`,
                sql`NULL`,
              )
              .as("searchable_by"),
            eb.fn
              .coalesce(
                sql`${eb.ref("values.sorted_by")}::sorted_by`,
                sql`NULL`,
              )
              .as("sorted_by"),
            eb.fn
              .coalesce(
                sql`${eb.ref("values.voluntary_to_immersion")}::boolean`,
                sql`NULL`,
              )
              .as("voluntary_to_immersion"),
          ]),
      )
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
