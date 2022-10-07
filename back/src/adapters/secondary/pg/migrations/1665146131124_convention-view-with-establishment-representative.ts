/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Delete view
  pgm.dropView("view_conventions");

  // Recreate view
  pgm.createView(
    "view_conventions",
    {},
    `
    SELECT 
        c.id AS "id convention",

        /* AGENCY INFOS */
        a."Nom" AS "Structure",
        a."Type" AS "Type de structure", 
        a."Département" AS "Département de la structure",
        a."Région" AS "Région de la structure",

        /* CONVENTION STATE INFOS */
        TO_CHAR(c.date_submission::date, 'dd/mm/yyyy') AS "Date de la demande",
        TO_CHAR(c.date_validation::date, 'dd/mm/yyyy') AS "Date de validation",
        c.status as "Statut", 
        (CASE WHEN b.signed_at is not null then 'Oui' else 'Non' end ) AS  "Accepté par le bénéficiaire",
        (CASE WHEN c.beneficiary_representative_id is null 
          THEN 'N/A'
          ELSE CASE WHEN br.signed_at is not null THEN 'Oui' ELSE 'Non' END
        END) AS "Accepté par le rep. légal du bénéfiaire",
        (CASE WHEN er.signed_at is not null then 'Oui' else 'Non' end ) AS "Accepté par l'entreprise",

        /* CONVENTION SCHEDULE & CONDITIONS INFOS */
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
        (regexp_match(c.immersion_address, '\\d{5}'))[1] AS "Code Postal",
        
        /* BENEFICIARY INFOS */
        CONCAT(b.first_name, ' ',  b.last_name) AS "Bénéficiaire",
        b.email AS "Email bénéficiaire",
        b.phone AS "Téléphone bénéficiaire",
        b.extra_fields->>'emergencyContact' AS "Contact d'urgence",
        b.extra_fields->>'emergencyContactPhone' AS "Téléphone du contact d'urgence",
        CONCAT(br.first_name, ' ',  br.last_name) AS "Rep. légal du Bénéficiaire",
        br.email AS "Email rep. légal",
        br.phone AS "Téléphone rep. légal",
        c.individual_protection AS "Protection individuelle",
        c.sanitary_prevention AS "Prévention sanitaire",
        c.sanitary_prevention_description AS "Descriptif des préventions sanitaires",
        user_pe_external_id  AS "Identifiant Externe Pole Emploi", 
        c.siret AS "Siret",
        (CASE WHEN fe.siret IS NOT NULL then 'Oui' else 'Non' end ) AS "Référencement IF",
        fe.source AS "Source du référencement",
        c.business_name AS "Entreprise",
        
        /* MENTOR INFOS */
        CONCAT(m.first_name, ' ',  m.last_name, ' ', m.extra_fields->>'job') AS "Mentor",
        m.phone AS "Téléphone du mentor",
        m.email AS "Email du mentor",
        
        /* ESTABLISHMENT REP INFOS */
        CONCAT(er.first_name, ' ',  er.last_name) AS "Rep. de l'entreprise",
        er.phone AS "Téléphone du rep. de l'entreprise",
        er.email AS "Email du rep. de l'entreprise",

        /* ASSESMENT INFOS */
        ass.status AS "Issue de l'immersion",
        ass.created_at AS "Date du bilan",
        ass.establishment_feedback AS "Commentaire du bilan",
        
        /* METADATA */
        c.created_at AS "Date de création",
        c.updated_at AS "Date de mise à jour"

        FROM conventions AS c 
          LEFT JOIN view_agencies AS a ON a.id = c.agency_id
          LEFT JOIN partners_pe_connect AS p ON p.convention_id = c.id
          LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = c.immersion_appellation
          LEFT JOIN public_romes_data AS prd ON pad.code_rome = prd.code_rome
          LEFT JOIN form_establishments AS fe ON fe.siret = c.siret
          LEFT JOIN immersion_assessments AS ass ON ass.convention_id = c.id
          LEFT JOIN actors AS b ON c.beneficiary_id = b.id
          LEFT JOIN actors AS m ON c.mentor_id = m.id
          LEFT JOIN actors AS er ON c.establishment_representative_id = er.id
          LEFT JOIN actors AS br ON c.beneficiary_representative_id = br.id
          `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Delete view
  pgm.dropView("view_conventions");

  // Recreate original view
  pgm.createView(
    "view_conventions",
    {},
    `    
    WITH convention_beneficiary AS (
    SELECT 
      conventions.id AS convention_id,
      first_name AS beneficiary_first_name, 
      last_name AS beneficiary_last_name,
      email  AS beneficiary_email, 
      phone  AS beneficiary_phone,
      extra_fields->>'emergencyContact' AS emergency_contact,
      extra_fields->>'emergencyContactPhone' AS emergency_contact_phone,
      signed_at is not null AS beneficiary_accepted
    FROM conventions LEFT JOIN actors ON conventions.beneficiary_id = actors.id
    ),

  convention_mentor AS (
  SELECT 
    conventions.id AS convention_id,
    first_name AS mentor_first_name, 
    last_name AS mentor_last_name,
    email  AS mentor_email, 
    phone  AS mentor_phone,
    extra_fields->>'job' AS mentor_job,
    signed_at is not null AS enterprise_accepted
  FROM conventions LEFT JOIN actors ON conventions.mentor_id = actors.id
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
          LEFT JOIN form_establishments fe ON fe.siret = c.siret`,
  );
}
