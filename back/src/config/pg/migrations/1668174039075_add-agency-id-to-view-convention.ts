import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_conventions");
  pgm.createView(
    "view_conventions",
    {},
    `
    SELECT 
        c.id AS "id",
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
        CONCAT(et.first_name, ' ',  et.last_name, ' ', et.extra_fields->>'job') AS "Tuteur de l'entreprise",
        et.phone AS "Téléphone du tuteur de l'entreprise",
        et.email AS "Email du tuteur de l'entreprise",
        
        /* ESTABLISHMENT REP INFOS */
        CONCAT(er.first_name, ' ',  er.last_name) AS "Rep. de l'entreprise",
        er.phone AS "Téléphone du rep. de l'entreprise",
        er.email AS "Email du rep. de l'entreprise",

        /* ASSESMENT INFOS */
        ass.status AS "Issue de l'immersion",
        ass.created_at AS "Date du bilan",
        ass.establishment_feedback AS "Commentaire du bilan",
        
        /* METADATA */
        a.id AS "StructureId",
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
          LEFT JOIN actors AS et ON c.establishment_tutor_id = et.id
          LEFT JOIN actors AS er ON c.establishment_representative_id = er.id
          LEFT JOIN actors AS br ON c.beneficiary_representative_id = br.id
          `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_conventions");
  pgm.createView(
    "view_conventions",
    {},
    `
    SELECT 
        c.id AS "id",
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
        CONCAT(et.first_name, ' ',  et.last_name, ' ', et.extra_fields->>'job') AS "Tuteur de l'entreprise",
        et.phone AS "Téléphone du tuteur de l'entreprise",
        et.email AS "Email du tuteur de l'entreprise",
        
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
          LEFT JOIN actors AS et ON c.establishment_tutor_id = et.id
          LEFT JOIN actors AS er ON c.establishment_representative_id = er.id
          LEFT JOIN actors AS br ON c.beneficiary_representative_id = br.id
          `,
  );
}
