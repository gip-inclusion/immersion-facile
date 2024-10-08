import { sql } from "kysely";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";

const uniqueEstablishmentContacts = (
  mode: "siret" | "contactEmail" | "all",
) => `
SELECT 
  DISTINCT ON (siret) siret, 
  uuid 
FROM 
  establishments_contacts
${mode === "contactEmail" ? "WHERE establishments_contacts.email = $1" : ""}
`;

const filteredImmersionOffertSubQuery = (
  mode: "siret" | "contactEmail" | "all",
) => `
SELECT
  immersion_offers.siret as siret, 
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'romeCode', rome_code, 
      'romeLabel', libelle_rome, 
      'appellationCode', appellation_code::text, 
      'appellationLabel', pad.libelle_appellation_long::text,
      'createdAt', 
      to_char(
        created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
      )
    )
    ORDER BY appellation_code
  ) as immersionOffers 
FROM immersion_offers
LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = immersion_offers.appellation_code
LEFT JOIN public_romes_data AS prd ON prd.code_rome = immersion_offers.rome_code
${
  mode === "contactEmail"
    ? "RIGHT JOIN unique_establishments_contacts as uec ON uec.siret = immersion_offers.siret"
    : ""
}
${mode === "siret" ? "WHERE siret = $1 " : ""}
GROUP BY immersion_offers.siret

`;

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

const selectJsonAggregate = `
SELECT 
  JSON_STRIP_NULLS(
    JSON_BUILD_OBJECT(
      'establishment', JSON_BUILD_OBJECT(
        'acquisitionCampaign', e.acquisition_campaign,
        'acquisitionKeyword' , e.acquisition_keyword,
        'score', e.score,
        'siret', e.siret, 
        'name', e.name, 
        'customizedName', e.customized_name, 
        'website', e.website, 
        'additionalInformation', e.additional_information,
        'locations', ela.locations,  
        'sourceProvider', e.source_provider,  
        'nafDto', JSON_BUILD_OBJECT(
          'code', e.naf_code, 
          'nomenclature', e.naf_nomenclature
        ), 
        'numberEmployeesRange', e.number_employees, 
        'updatedAt', to_char(
          e.update_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        ), 
        'createdAt', to_char(
          e.created_at::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        ), 
        'lastInseeCheckDate', to_char(
          e.last_insee_check_date::timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
        ), 
        'isOpen', e.is_open, 
        'isSearchable', e.is_searchable, 
        'isCommited', e.is_commited,
        'fitForDisabledWorkers', e.fit_for_disabled_workers,
        'maxContactsPerMonth', e.max_contacts_per_month,
        'nextAvailabilityDate', date_to_iso(e.next_availability_date),
        'searchableBy', JSON_BUILD_OBJECT(
          'jobSeekers', e.searchable_by_job_seekers,
          'students', e.searchable_by_students
        )
      ), 
      'immersionOffers', io.immersionOffers, 
      'contact', JSON_BUILD_OBJECT(
        'id', ec.uuid, 'firstName', ec.firstname, 
        'lastName', ec.lastname, 'job', ec.job, 
        'contactMethod', ec.contact_mode, 
        'phone', ec.phone, 'email', ec.email, 
        'copyEmails', ec.copy_emails
      )
    )
  ) AS aggregate 
`;

export const establishmentByFilters = (
  mode: "siret" | "contactEmail" | "all",
) => `
WITH 
  unique_establishments_contacts AS (${uniqueEstablishmentContacts(mode)}), 
  filtered_immersion_offers AS (${filteredImmersionOffertSubQuery(mode)}),
  establishment_locations_agg AS (${withEstablishmentLocationsSubQuery})
${selectJsonAggregate}
FROM filtered_immersion_offers AS io 
LEFT JOIN establishments AS e ON e.siret = io.siret 
LEFT JOIN unique_establishments_contacts AS uec ON e.siret = uec.siret 
LEFT JOIN establishments_contacts AS ec ON uec.uuid = ec.uuid
LEFT JOIN establishment_locations_agg AS ela ON e.siret = ela.establishment_siret
ORDER BY e.siret
`;

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
