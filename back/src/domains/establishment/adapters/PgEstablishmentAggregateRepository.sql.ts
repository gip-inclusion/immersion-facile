import { sql } from "kysely";
import { jsonArrayFrom, jsonBuildObject } from "kysely/helpers/postgres";
import {
  KyselyDb,
  jsonStripNulls,
} from "../../../config/pg/kysely/kyselyUtils";

export const withEstablishmentLocationsSubQuery = `
SELECT
  establishment_siret,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', id,
      'position', JSON_BUILD_OBJECT('lon', lon, 'lat', lat),
      'address', JSON_BUILD_OBJECT(
          'streetNumberAndAddress', street_number_and_address,
          'postcode', post_code,
          'city', city,
          'departmentCode', department_code
      )
    )
  ) AS locations
FROM establishments_location_infos
GROUP BY establishment_siret
`;

export const establishmentByFilters = (db: KyselyDb) =>
  db
    .selectFrom("establishments as e")
    .select(({ ref, eb }) =>
      jsonStripNulls(
        jsonBuildObject({
          establishment: jsonBuildObject({
            acquisitionCampaign: ref("e.acquisition_campaign"),
            acquisitionKeyword: ref("e.acquisition_keyword"),
            score: ref("e.score"),
            siret: ref("e.siret"),
            name: ref("e.name"),
            customizedName: ref("e.customized_name"),
            contactMethod: ref("e.contact_mode"),
            website: ref("e.website"),
            additionalInformation: ref("e.additional_information"),
            locations: jsonArrayFrom(
              eb
                .selectFrom("establishments_location_infos as loc")
                .whereRef("loc.establishment_siret", "=", "e.siret")
                .select(({ ref }) =>
                  jsonBuildObject({
                    id: ref("loc.id"),
                    position: jsonBuildObject({
                      lon: ref("loc.lon"),
                      lat: ref("loc.lat"),
                    }),
                    address: jsonBuildObject({
                      streetNumberAndAddress: ref(
                        "loc.street_number_and_address",
                      ),
                      postcode: ref("loc.post_code"),
                      city: ref("loc.city"),
                      departmentCode: ref("department_code"),
                    }),
                  }).as("location"),
                ),
            ),
            sourceProvider: ref("e.source_provider"),
            numberEmployeesRange: ref("e.number_employees"),
            updatedAt: sql<string>`TO_CHAR( ${ref(
              "e.update_date",
            )}::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"' )`,
            createdAt: sql<string>`TO_CHAR( ${ref(
              "e.created_at",
            )}::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"' )`,
            lastInseeCheckDate: sql<string>`TO_CHAR( ${ref(
              "e.last_insee_check_date",
            )}::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"' )`,
            isOpen: ref("e.is_open"),
            isSearchable: ref("e.is_searchable"),
            isCommited: ref("e.is_commited"),
            fitForDisabledWorkers: ref("e.fit_for_disabled_workers"),
            maxContactsPerMonth: ref("e.max_contacts_per_month"),
            nextAvailabilityDate: sql<string>`date_to_iso(${ref(
              "e.next_availability_date",
            )})`,
            searchableBy: jsonBuildObject({
              jobSeekers: ref("e.searchable_by_job_seekers"),
              students: ref("e.searchable_by_students"),
            }),
            nafDto: jsonBuildObject({
              code: ref("e.naf_code"),
              nomenclature: ref("e.naf_nomenclature"),
            }),
          }),
          immersionOffers: jsonArrayFrom(
            eb
              .selectFrom("immersion_offers as io")
              .leftJoin(
                "public_appellations_data as pad",
                "pad.ogr_appellation",
                "io.appellation_code",
              )
              .leftJoin(
                "public_romes_data as prd",
                "prd.code_rome",
                "io.rome_code",
              )
              .whereRef("io.siret", "=", "e.siret")
              .select(({ ref }) =>
                jsonBuildObject({
                  romeCode: ref("io.rome_code"),
                  romeLabel: ref("prd.libelle_rome"),
                  appellationCode: sql<string>`${ref(
                    "io.appellation_code",
                  )}::text`,
                  appellationLabel: ref("pad.libelle_appellation_long"),
                  createdAt: sql<string>`TO_CHAR( ${ref(
                    "io.created_at",
                  )}::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"' )`,
                }).as("offer"),
              )
              .orderBy("io.appellation_code asc"),
          ),
          userRights: jsonArrayFrom(
            eb
              .selectFrom("establishments__users as eu")
              .whereRef("eu.siret", "=", "e.siret")
              .select(({ ref }) =>
                jsonBuildObject({
                  userId: ref("eu.user_id"),
                  role: ref("eu.role"),
                  job: ref("eu.job"),
                  phone: ref("eu.phone"),
                }).as("userRight"),
              ),
          ),
        }),
      ).as("aggregate"),
    )
    .groupBy("e.siret")
    .orderBy("e.siret asc");

export const updateAllEstablishmentScoresQuery = async (
  db: KyselyDb,
): Promise<void> => {
  const minimumScore = 10;
  const conventionCountCoefficient = 20;

  await db
    .with("convention_counts", (qb) =>
      qb
        .selectFrom("conventions")
        .where("date_submission", ">=", sql<Date>`NOW() - INTERVAL '1 year'`)
        .where("status", "=", "ACCEPTED_BY_VALIDATOR")
        .groupBy("siret")
        .select([
          "siret",
          ({ fn }) => fn.count("siret").as("convention_count"),
        ]),
    )
    .with("discussion_counts", (qb) =>
      qb
        .selectFrom("discussions as d")
        .innerJoin("exchanges", "d.id", "exchanges.discussion_id")
        .where("d.created_at", ">=", sql<Date>`NOW() - INTERVAL '1 year'`)
        .select([
          "siret",
          sql`COUNT(DISTINCT d.id)`.as("total_discussions"),
          sql`COUNT(DISTINCT CASE WHEN exchanges.sender = 'establishment'::exchange_role THEN d.id END)`.as(
            "answered_discussions",
          ),
        ])
        .groupBy("siret"),
    )
    .updateTable("establishments as e")
    .set({
      score: sql`ROUND(
          (${minimumScore} + COALESCE((SELECT convention_count * ${conventionCountCoefficient} FROM convention_counts WHERE siret = e.siret), 0))
          * (COALESCE((
            SELECT
              CASE
                WHEN total_discussions > 0
                THEN (answered_discussions::float / total_discussions)
                ELSE 1
              END
            FROM discussion_counts
            WHERE siret = e.siret
          ), 1)
        ))`,
    })
    .execute();
};
