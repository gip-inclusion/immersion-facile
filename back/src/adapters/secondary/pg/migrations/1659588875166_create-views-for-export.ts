import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(
    "view_siret_with_department_region",
    {},
    `
      SELECT e.siret, department_name, region_name
      FROM establishments AS e
      LEFT JOIN public_department_region pdr ON pdr.department_code = e.department_code`,
  );

  pgm.createView(
    "view_contact_requests",
    {},
    `
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
      LEFT JOIN view_siret_with_department_region e ON e.siret = o."Siret"`,
  );

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
    WHERE data_source = 'form'
    `,
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

  pgm.createView(
    "view_agencies",
    {},
    `SELECT 
      a.id,
      a.name AS "Nom",
      a.code_safir AS "Code Safir",
      a.kind AS "Type",
      a.status AS "Statut",
      to_char(a.created_at, 'DD/MM/YYYY'::text) AS "Date de création",
      a.street_number_and_address AS "Adresse",
      a.post_code AS "Code Postal",
      a.counsellor_emails AS "Emails des conseillers",
      a.validator_emails AS "Emails des valideurs",
      pdr.department_name AS "Département",
      pdr.region_name AS "Région"
    FROM agencies a
      LEFT JOIN public_department_region pdr ON pdr.department_code = a.department_code
    ORDER BY pdr.department_name;
    `,
  );

  pgm.createView(
    "view_conventions",
    {},
    `
  SELECT 
      c.id AS "id convention",
      a."Nom" AS "Structure",
      a."Type" AS "Type de structure", 
      a."Département" AS "Département de la structure",
      a."Région" AS "Région de la structure",
      TO_CHAR(c.date_submission::date, 'dd/mm/yyyy') AS "Date de la demande",
      TO_CHAR(c.date_validation::date, 'dd/mm/yyyy') AS "Date de validation",
      c.status as "Statut", 
      (CASE WHEN c.beneficiary_accepted then 'Oui' else 'Non' end ) AS  "Accepté par le bénéficiaire",
      (CASE WHEN c.enterprise_accepted then 'Oui' else 'Non' end ) AS "Accepté par l'entreprise",
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
      CONCAT(c.first_name, ' ',  c.last_name) AS "Bénéficiaire",
      (regexp_match(c.immersion_address, '\\d{5}'))[1] AS "Code Postal",
      c.email AS "Email bénéficiaire",
      c.phone AS "Téléphone bénéficiaire",
      c.emergency_contact AS "Contact d'urgence",
      c.emergency_contact_phone AS "Téléphone du contact d'urgence",
      c.individual_protection AS "Protection individuelle",
      c.sanitary_prevention AS "Prévention sanitaire",
      c.sanitary_prevention_description AS "Descriptif des préventions sanitaires",
      user_pe_external_id  AS "Identifiant Externe Pole Emploi", 
      c.siret AS "Siret",
      (CASE WHEN fe.siret IS NOT NULL then 'Oui' else 'Non' end ) AS "Référencement IF",
      c.business_name AS "Entreprise",
      c.mentor AS "Tuteur",
      c.mentor_phone AS "Téléphone du tuteur",
      c.mentor_email AS "Email du tuteur"

      FROM conventions AS c 
      LEFT JOIN view_agencies a ON a.id = c.agency_id
      LEFT JOIN partners_pe_connect p ON p.convention_id = c.id
      LEFT JOIN public_appellations_data pad ON pad.ogr_appellation = c.immersion_appellation
      LEFT JOIN public_romes_data prd ON pad.code_rome = prd.code_rome
      LEFT JOIN form_establishments fe ON fe.siret = c.siret `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_establishments_with_aggregated_offers");
  pgm.dropView("view_establishments_with_flatten_offers");
  pgm.dropView("view_conventions");
  pgm.dropView("view_agencies");
  pgm.dropView("view_contact_requests");
  pgm.dropView("view_siret_with_department_region");
}
