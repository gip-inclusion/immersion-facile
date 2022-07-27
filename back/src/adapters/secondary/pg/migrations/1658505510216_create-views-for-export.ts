import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(
    "view_siret_with_department_region",
    {},
    `
  WITH 
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
            )
    SELECT  e.siret, postal_code, department, region
    FROM establishments AS e
    LEFT JOIN siret_postal_code spc ON spc.siret = e.siret
    LEFT JOIN left_digits_code_department_region ldcdr ON ldcdr.department_code = left(spc.postal_code, 3)
`,
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
      e.department AS "Département", 
      e.region AS "Région"
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
      address AS "Adresse",
      postal_code AS "Code Postal",
      --(regexp_matches(address, '\\d{5}\\s(.)$'))[1] AS "Ville", TODO ! 
      sdr.department AS "Département",
      sdr.region AS "Région",
      naf_code AS "NAF",
      pnc.class_label AS "Division NAF",
      number_employees AS "Nombre d’employés",
      (CASE WHEN ic.contact_mode = 'PHONE' then 'Téléphone' when ic.contact_mode = 'IN_PERSON' then 'En personne' else 'Email' end) AS  "Mode de contact", 
      (CASE WHEN is_commited then 'Oui' else 'Non déclaré' end ) AS "Appartenance Réseau « Les entreprises s’engagent »", 
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
        "Enseigne", "Adresse",  "Code Postal",	"Département",	"Région",	"NAF",	"Division NAF",
        "Nombre d’employés", "Mode de contact",	"Appartenance Réseau « Les entreprises s’engagent »",
        "Visible",	"Origine", aggregated."Codes Métier", aggregated."Métiers"
      FROM aggregated LEFT JOIN view_establishments_with_flatten_offers AS f ON f."Siret" = aggregated."Siret"
  `,
  );

  pgm.createView(
    "view_agencies",
    {},
    `WITH left_digits_code_department_region AS (
             SELECT DISTINCT postal_code_department_region.department,
                postal_code_department_region.region,
                "left"((postal_code_department_region.postal_code)::text, 3) AS department_code
               FROM postal_code_department_region
            ), code_matches AS (
             SELECT agencies.id,
                regexp_matches((agencies.address)::text, '\\d{5}'::text, 'ig'::text) AS code_matches
               FROM agencies
            ), agg_code_matches AS (
             SELECT code_matches.id,
                array_agg(code_matches.code_matches[1]) AS code_matches
               FROM code_matches
              GROUP BY code_matches.id
            ), code_by_agency_id AS (
             SELECT agg_code_matches.id,
                agg_code_matches.code_matches[array_length(agg_code_matches.code_matches, 1)] AS postal_code
               FROM agg_code_matches
            )
     SELECT 
        a.id,
        a.name AS "Nom",
        a.code_safir AS "Code Safir",
        a.kind AS "Type",
        a.status AS "Statut",
        to_char(a.created_at, 'DD/MM/YYYY'::text) AS "Date de créationt",
        a.address AS "Adresse",
        c.postal_code AS "Code Postal",
        ldcdr.department AS "Département",
        ldcdr.region AS "Région"
       FROM ((agencies a
         LEFT JOIN code_by_agency_id c ON ((c.id = a.id)))
         LEFT JOIN left_digits_code_department_region ldcdr ON ((ldcdr.department_code = left(c.postal_code, 3))))
      ORDER BY ldcdr.department;
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
      c.beneficiary_accepted AS "Accepté par le bénéficiaire",
      c.enterprise_accepted AS "Accepté par l'entreprise",
      TO_CHAR(c.date_start::date, 'dd/mm/yyyy') AS "Date de début",
      TO_CHAR(c.date_end::date, 'dd/mm/yyyy') AS "Date de fin",
          -- Nombre d’heures total de l’immersion // TODO ! 
      c.immersion_objective AS "Objectif de l'immersion", 
      pad.libelle_appellation_long AS "Métier observé",
      c.work_conditions AS "Conditions de travail particulières",
      immersion_activities AS "Activités",
      c.immersion_skills AS "Compétences développées",
      c.schedule -> 'complexSchedule' AS "Programme",
      c.last_name AS "Nom bénéficiaire",
      c.first_name AS "Prénom bénéficiaire",
      (regexp_match(c.immersion_address, '\\d{5}'))[1] AS "Code Postal",
      c.email AS "Email bénéficiaire",
      c.phone AS "Téléphone bénéficiaire",
      c.emergency_contact AS "Contact d'urgence",
      c.emergency_contact_phone AS "Téléphone du contact d'urgence",
      c.individual_protection as "Protection individuelle",
      c.sanitary_prevention as "Prévention sanitaire",
      c.sanitary_prevention_description as "Descriptif des préventions sanitaires",
      user_pe_external_id  AS "Identifiant Externe Pole Emploi", 
      c.siret AS "Siret",
      (fe.siret IS NOT NULL) AS "Référencement IF",
      c.business_name AS "Entreprise",
      c.mentor AS "Tuteur",
      c.mentor_phone AS "Téléphone du tuteur",
      c.mentor_email AS "Email du tuteur"

      FROM conventions AS c 
      LEFT JOIN view_agencies a ON a.id = c.agency_id
      LEFT JOIN partners_pe_connect p ON p.convention_id = c.id
      LEFT JOIN public_appellations_data pad ON pad.ogr_appellation = c.immersion_appellation
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
