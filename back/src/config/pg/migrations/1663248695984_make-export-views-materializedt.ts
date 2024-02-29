import { MigrationBuilder } from "node-pg-migrate";

// Unchanged queries (views remain the same but just turn into materialized views)
const SQL_view_siret_with_department_region = `SELECT e.siret, department_name, region_name
FROM establishments AS e
LEFT JOIN public_department_region pdr ON pdr.department_code = e.department_code`;

const SQL_view_contact_requests = `
    WITH outbox_contact_requests AS (
      SELECT 
        TO_CHAR(outbox.occurred_at::date, 'dd/mm/yyyy') AS "Date de la mise en relation",
        (outbox.payload ->> 'contactMode'::text) AS "Type de mise en relation",
        (outbox.payload ->> 'potentialBeneficiaryEmail'::text) AS "Email",
        (outbox.payload ->> 'siret'::text) AS "Siret",
        (outbox.payload ->> 'romeLabel'::text) AS "Métier"
        FROM outbox
        WHERE ((outbox.topic)::text = 'ContactRequestedByBeneficiary'::text)
        )
    SELECT 
      o.*,
      prd.code_rome AS "Code métier",
      e.department_name AS "Département", 
      e.region_name AS "Région"
    FROM 
    outbox_contact_requests AS o
    LEFT JOIN public_romes_data prd ON prd.libelle_rome = o."Métier"
    LEFT JOIN view_siret_with_department_region e ON e.siret = o."Siret"`;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop all excel views to make them materialized
  pgm.dropView("view_establishments_with_aggregated_offers");
  pgm.dropView("view_establishments_with_flatten_offers");
  pgm.dropView("view_conventions");
  pgm.dropView("view_contact_requests");
  pgm.dropView("view_siret_with_department_region");

  pgm.createMaterializedView(
    "view_siret_with_department_region",
    {},
    SQL_view_siret_with_department_region,
  );

  pgm.createMaterializedView(
    "view_contact_requests",
    {},
    SQL_view_contact_requests,
  );

  // Fix views on establishments
  pgm.createMaterializedView(
    "view_establishments",
    {},
    `
  WITH 
    count_conventions_by_siret AS (
        SELECT siret, count(*) 
        FROM conventions WHERE status in ('VALIDATED', 'ACCEPETED_BY_VALIDATOR') 
        GROUP BY siret
        ),
    count_contact_requests_by_siret AS (
        SELECT count (distinct ("Email", "Code métier")), "Siret"
        FROM view_contact_requests
        GROUP BY  "Siret"
        )
    SELECT 
        TO_CHAR(e.created_at::date, 'dd/mm/yyyy') AS "Date de référencement",
        TO_CHAR(e.update_date::date, 'dd/mm/yyyy') AS "Date de mise à jour",
        e.siret AS "Siret", 
        name AS "Raison Sociale",
        customized_name AS "Enseigne", 
        street_number_and_address AS "Adresse",
        post_code AS "Code Postal",
        city AS "Ville",
        sdr.department_name AS "Département",
        sdr.region_name AS "Région",
        naf_code AS "NAF",
        pnc.class_label AS "Division NAF",
        number_employees AS "Nombre d’employés",
        CONCAT(ic.firstname, ic.lastname) AS "Contact",
        ic.job AS "Rôle du contact",
        ic.email AS "Email du contact",
        ic.phone AS "Téléphone du contact",
        (CASE WHEN ic.contact_mode = 'PHONE' then 'Téléphone' when ic.contact_mode = 'IN_PERSON' then 'En personne' else 'Email' end) AS  "Mode de contact", 
        (CASE WHEN is_commited then 'Oui' else 'Non déclaré' end ) AS "Appartenance Réseau « Les entreprises s’engagent »", 
        (CASE WHEN is_searchable then 'Oui' else 'Non' end ) AS "Visible",
        source_provider AS "Origine",
        coalesce(count_rel.count, 0) AS "Nombre de mise en relation pour cette entreprise",
        coalesce(count_conv.count, 0) AS "Nombre de convention validée pour cette entreprise"
    FROM establishments AS e
      LEFT JOIN establishments__immersion_contacts eic ON eic.establishment_siret = e.siret
      LEFT JOIN immersion_contacts ic ON eic.contact_uuid = ic.uuid
      LEFT JOIN view_siret_with_department_region sdr ON sdr.siret = e.siret
      LEFT JOIN public_naf_classes_2008 pnc ON pnc.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d)(\\w)', '\\1.\\2')
      LEFT JOIN count_contact_requests_by_siret count_rel ON count_rel."Siret" = e.siret
      LEFT JOIN count_conventions_by_siret count_conv ON count_conv.siret = e.siret
    WHERE data_source = 'form'`,
  );

  pgm.createMaterializedView(
    "view_establishments_with_aggregated_offers",
    {},
    `
    WITH 
      offers_by_siret AS (
        SELECT e.siret, 
          ARRAY_AGG(libelle_rome) AS rome_labels,
          ARRAY_AGG(rome_code) AS rome_codes
        FROM establishments AS e
        LEFT JOIN immersion_offers io ON io.siret = e.siret
        LEFT JOIN public_romes_data prd ON prd.code_rome = io.rome_code
        WHERE data_source = 'form'
        GROUP BY e.siret)
    SELECT 
        view_establishments.*,
        rome_codes AS "Codes Métier",
        rome_labels AS "Métiers"
    FROM view_establishments 
      LEFT JOIN offers_by_siret io ON io.siret = view_establishments."Siret"`,
  );

  pgm.createMaterializedView(
    "view_establishments_with_flatten_offers",
    {},
    `
    WITH 
      offers_by_siret AS (
        SELECT e.siret, 
         libelle_rome AS rome_label,
         rome_code AS rome_code
        FROM establishments AS e
        LEFT JOIN immersion_offers io ON io.siret = e.siret
        LEFT JOIN public_romes_data prd ON prd.code_rome = io.rome_code
        WHERE data_source = 'form')
    SELECT 
        view_establishments.*,
        rome_code AS "Code Métier",
        rome_label AS "Métier"
    FROM view_establishments 
      LEFT JOIN offers_by_siret io ON io.siret = view_establishments."Siret"`,
  );

  // Improve view on conventions
  const SQL_view_conventions = `
    WITH convention_beneficiary AS (
      SELECT 
        convention_id,
        first_name AS beneficiary_first_name, 
        last_name AS beneficiary_last_name,
        email  AS beneficiary_email, 
        phone  AS beneficiary_phone,
        signatories.extra_fields->>'emergencyContact' AS emergency_contact,
        signatories.extra_fields->>'emergencyContactPhone' AS emergency_contact_phone,
        signed_at is not null AS beneficiary_accepted
      FROM signatories
      WHERE role = 'beneficiary'
      ),

    convention_mentor AS (
    SELECT 
      convention_id,
      first_name AS mentor_first_name, 
      last_name AS mentor_last_name,
      email  AS mentor_email, 
      phone  AS mentor_phone,
      signatories.extra_fields->>'job' AS mentor_job,
      signed_at is not null AS enterprise_accepted
    FROM signatories
    WHERE role = 'establishment'
    ),

    flatten_signatories AS (
      SELECT cb.*, mentor_first_name, mentor_last_name, mentor_email, mentor_phone,  mentor_job, enterprise_accepted
    FROM convention_beneficiary cb left join convention_mentor cm on cb.convention_id = cm.convention_id)

      SELECT 
          c.id AS "id convention",
          a."Nom" AS "Structure",
          a."Type" AS "Type de structure", 
          a."Département" AS "Département de la structure",
          a."Région" AS "Région de la structure",
          TO_CHAR(c.date_submission::date, 'dd/mm/yyyy') AS "Date de la demande",
          TO_CHAR(c.date_validation::date, 'dd/mm/yyyy') AS "Date de validation",
          c.status as "Statut", 
          (CASE WHEN s.beneficiary_accepted then 'Oui' else 'Non' end ) AS  "Accepté par le bénéficiaire",
          (CASE WHEN s.enterprise_accepted then 'Oui' else 'Non' end ) AS "Accepté par l'entreprise",
          TO_CHAR(c.date_start::date, 'dd/mm/yyyy') AS "Date de début",
          TO_CHAR(c.date_end::date, 'dd/mm/yyyy') AS "Date de fin",
          c.immersion_objective AS "Objectif de l'immersion", 
          pad.libelle_appellation_long AS "Métier observé",
          prd.code_rome AS "Rome du métier observé",
          c.work_conditions AS "Conditions de travail particulières",
          immersion_activities AS "Activités",
          c.immersion_skills AS "Compétences développées",
          c.schedule -> 'complexSchedule' AS "Programme",
          NULL AS "Durée de l'immersion",
          CONCAT(s.beneficiary_first_name, ' ',  s.beneficiary_last_name) AS "Bénéficiaire",
          (regexp_match(c.immersion_address, '\\d{5}'))[1] AS "Code Postal",
          s.beneficiary_email AS "Email bénéficiaire",
          s.beneficiary_phone AS "Téléphone bénéficiaire",
          s.emergency_contact AS "Contact d'urgence",
          s.emergency_contact_phone AS "Téléphone du contact d'urgence",
          c.individual_protection AS "Protection individuelle",
          c.sanitary_prevention AS "Prévention sanitaire",
          c.sanitary_prevention_description AS "Descriptif des préventions sanitaires",
          user_pe_external_id  AS "Identifiant Externe Pole Emploi", 
          c.siret AS "Siret",
          (CASE WHEN fe.siret IS NOT NULL then 'Oui' else 'Non' end ) AS "Référencement IF",
          fe.source AS "Source du référencement",
          c.business_name AS "Entreprise",
          CONCAT(s.mentor_first_name, ' ',  s.mentor_last_name, ' ', s.mentor_job) AS "Tuteur",
          s.mentor_phone AS "Téléphone du tuteur",
          s.mentor_email AS "Email du tuteur"

          FROM conventions AS c 
            LEFT JOIN flatten_signatories s on s.convention_id = c.id
            LEFT JOIN view_agencies a ON a.id = c.agency_id
            LEFT JOIN partners_pe_connect p ON p.convention_id = c.id
            LEFT JOIN public_appellations_data pad ON pad.ogr_appellation = c.immersion_appellation
            LEFT JOIN public_romes_data prd ON pad.code_rome = prd.code_rome
            LEFT JOIN form_establishments fe ON fe.siret = c.siret 
    `;
  pgm.createView("view_conventions", {}, SQL_view_conventions);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop materialized views
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");
  pgm.dropMaterializedView("view_contact_requests");
  pgm.dropMaterializedView("view_siret_with_department_region");

  // Restore previous views
  pgm.createView(
    "view_siret_with_department_region",
    {},
    SQL_view_siret_with_department_region,
  );

  pgm.createView("view_contact_requests", {}, SQL_view_contact_requests);

  pgm.createView(
    "view_establishments_with_flatten_offers",
    {},
    `WITH 
        count_conventions_by_siret AS (
            SELECT siret, count(*) 
            FROM conventions WHERE status in ('VALIDATED', 'ACCEPETED_BY_VALIDATOR') 
            GROUP BY siret
            ),
        count_contact_requests_by_siret AS (
            SELECT count (distinct "Email" ), "Siret"
            FROM view_contact_requests
            GROUP BY  "Siret"
            )
    SELECT 
      TO_CHAR(e.created_at::date, 'dd/mm/yyyy') AS "Date de référencement",
      TO_CHAR(e.update_date::date, 'dd/mm/yyyy') AS "Date de mise à jour",
      e.siret AS "Siret", 
      name AS "Raison Sociale",
      customized_name AS "Enseigne", 
      street_number_and_address AS "Adresse",
      post_code AS "Code Postal",
      city AS "Ville",
      sdr.department_name AS "Département",
      sdr.region_name AS "Région",
      naf_code AS "NAF",
      pnc.class_label AS "Division NAF",
      number_employees AS "Nombre d’employés",
      CONCAT(ic.firstname, ic.lastname) AS "Contact",
      ic.job AS "Rôle du contact",
      ic.email AS "Email du contact",
      ic.phone AS "Téléphone du contact",
      (CASE WHEN ic.contact_mode = 'PHONE' then 'Téléphone' when ic.contact_mode = 'IN_PERSON' then 'En personne' else 'Email' end) AS  "Mode de contact", 
      (CASE WHEN is_commited then 'Oui' else 'Non déclaré' end ) AS "Appartenance Réseau « Les entreprises s’engagent »", 
      (CASE WHEN is_searchable then 'Oui' else 'Non' end ) AS "Visible",
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
      LEFT JOIN view_siret_with_department_region sdr ON sdr.siret = e.siret
      LEFT JOIN public_naf_classes_2008 pnc ON pnc.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d)(\\w)', '\\1.\\2')
      LEFT JOIN count_contact_requests_by_siret count_rel ON count_rel."Siret" = e.siret
      LEFT JOIN count_conventions_by_siret count_conv ON count_conv.siret = e.siret
    WHERE data_source = 'form'`,
  );

  pgm.createView(
    "view_establishments_with_aggregated_offers",
    {},
    `WITH aggregated AS (
          SELECT "Siret", ARRAY_AGG("Métier") AS "Métiers",  ARRAY_AGG("Code Métier") AS "Codes Métier" 
          FROM view_establishments_with_flatten_offers 
          GROUP BY "Siret")
      SELECT DISTINCT "Date de référencement", "Date de mise à jour", aggregated."Siret", "Raison Sociale", 
        "Enseigne", "Adresse",  "Code Postal",	"Ville", "Département",	"Région",	"NAF",	"Division NAF",
        "Nombre d’employés", "Mode de contact",	"Appartenance Réseau « Les entreprises s’engagent »",
        "Visible",	"Origine", aggregated."Codes Métier", aggregated."Métiers"
      FROM aggregated LEFT JOIN view_establishments_with_flatten_offers AS f ON f."Siret" = aggregated."Siret"
  `,
  );
}
