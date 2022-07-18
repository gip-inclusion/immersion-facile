import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createMaterializedView(
    "view_outbox_contact_requests_by_benificiary",
    {},
    `WITH outbox_contact_request_events AS (
        SELECT outbox.occurred_at,
          (outbox.payload ->> 'siret'::text) AS siret,
          (outbox.payload ->> 'romeLabel'::text) AS rome_label,
          (outbox.payload ->> 'potentialBeneficiaryEmail'::text) AS potential_beneficiary_email,
          (outbox.payload ->> 'contactMode'::text) AS contact_mode,
          (outbox.payload ->> 'message'::text) AS message
          FROM outbox
          WHERE ((outbox.topic)::text = 'ContactRequestedByBeneficiary'::text))
      SELECT o.occurred_at,
        o.siret,
        o.rome_label,
        o.potential_beneficiary_email,
        o.contact_mode,
        o.message,
        prd.code_rome AS rome_code
        FROM (outbox_contact_request_events o
        LEFT JOIN public_romes_data prd ON (((prd.libelle_rome)::text = o.rome_label)))`,
  );

  pgm.createMaterializedView(
    "view_establishments_with_flatten_offers",
    {},
    `WITH 
        left_digits_code_department_region AS (
            SELECT DISTINCT 
            postal_code_department_region.department,
            postal_code_department_region.region,
            left(postal_code_department_region.postal_code, 3) AS department_code
            FROM postal_code_department_region
            ),
        siret_postal_code AS (
            SELECT siret, (regexp_match(address, '\\d{5}'))[1] AS postal_code 
            FROM establishments 
            WHERE data_source = 'form'
            ),
        count_conventions_by_siret AS (
            SELECT siret, count(*) 
            FROM conventions WHERE status in ('VALIDATED', 'ACCEPETED_BY_VALIDATOR') 
            GROUP BY siret
            ),
        count_contact_requests_by_siret AS (
            SELECT count (distinct potential_beneficiary_email ), siret 
            FROM view_outbox_contact_requests_by_benificiary
            GROUP BY siret
            )
    SELECT 
      TO_CHAR(e.created_at::date, 'dd/mm/yyyy') AS "Date de référencement",
      TO_CHAR(e.update_date::date, 'dd/mm/yyyy') AS "Date de mise à jour",
      e.siret AS "Siret", 
      name AS "Raison Sociale",
      customized_name AS "Enseigne", 
      address AS "Adresse",
      postal_code AS "Code Postal",
      --(regexp_matches(address, '\\d{5}\\s(.)$'))[1] AS "Ville", TODO ! 
      ldcdr.department AS "Département",
      ldcdr.region AS "Région",
      naf_code AS "NAF",
      pnc.clASs_label AS "Division NAF",
      number_employees AS "Nombre d’employés",
      (cASe when ic.contact_mode = 'PHONE' then 'Téléphone' when ic.contact_mode = 'IN_PERSON' then 'En personne' else 'Email' end) AS  "Mode de contact", 
      (cASe when is_commited then 'Oui' else 'Non déclaré' end ) AS "Appartenance Réseau « Les entreprises s’engagent »", 
      is_searchable AS "Visible",
      source_provider AS "Origine",
      rome_code AS "Code Métier",
      libelle_rome AS "Métier",
      coalesce(count_rel.count, 0) AS "Nombre de mise en relation pour cette entreprise",
      coalesce(count_conv.count, 0) AS "Nombre de convention validée pour cette entreprise"
    FROM establishments AS e
      LEFT JOIN immersion_offers io ON io.siret = e.siret
      LEFT JOIN establishments__immersion_contacts eic ON eic.establishment_siret = e.siret
      LEFT JOIN immersion_contacts ic ON eic.contact_uuid = ic.uuid
      LEFT JOIN public_romes_data prd ON prd.code_rome = io.rome_code
      LEFT JOIN siret_postal_code spc ON spc.siret = e.siret
      LEFT JOIN left_digits_code_department_region ldcdr ON ldcdr.department_code = left(spc.postal_code, 3)
      LEFT JOIN public_naf_classes_2008 pnc ON pnc.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d)(\\w)', '\\1.\\2')
      LEFT JOIN count_contact_requests_by_siret count_rel ON count_rel.siret = e.siret
      LEFT JOIN count_conventions_by_siret count_conv ON count_conv.siret = e.siret
    WHERE data_source = 'form'
    `,
  );

  pgm.createMaterializedView(
    "view_establishments_with_aggregated_offers",
    {},
    `WITH aggregated AS (
          SELECT "Siret", ARRAY_AGG("Métier") AS "Métiers",  ARRAY_AGG("Code Métier") AS "Codes Métier" 
          FROM view_establishments_with_flatten_offers 
          GROUP BY "Siret")
      SELECT DISTINCT "Date de référencement", "Date de mise à jour", aggregated."Siret", "Raison Sociale", 
        "Enseigne", "Adresse",  "Code Postal",	"Département",	"Région",	"NAF",	"Division NAF",
        "Nombre d’employés", "Mode de contact",	"Appartenance Réseau « Les entreprises s’engagent »",
        "Visible",	"Origine", aggregated."Codes Métier", aggregated."Métiers"
      FROM aggregated LEFT JOIN view_establishments_with_flatten_offers AS f ON f."Siret" = aggregated."Siret"
  `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_outbox_contact_requests_by_benificiary");
}
