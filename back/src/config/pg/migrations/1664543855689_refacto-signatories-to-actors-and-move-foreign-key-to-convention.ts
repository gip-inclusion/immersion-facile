/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop view depending on stuff we're about to change
  pgm.dropView("view_conventions");

  pgm.renameTable("signatories", "actors");

  // Migrate definitions
  await pgm.addColumn("actors", { id: { type: "serial", primaryKey: true } });

  pgm.addColumns("conventions", {
    beneficiary_id: {
      type: "int",
      references: "actors",
      onDelete: "CASCADE",
    },
    mentor_id: {
      type: "int",
      references: "actors",
      onDelete: "CASCADE",
    },
    establishment_representative_id: {
      type: "int",
      references: "actors",
      onDelete: "CASCADE",
    },
    beneficiary_representative_id: {
      type: "int",
      references: "actors",
      onDelete: "CASCADE",
    },
  });

  // Migrate content
  pgm.sql(`
    UPDATE conventions
    SET 
      mentor_id = actors.id,
      establishment_representative_id = actors.id
    FROM actors
    WHERE conventions.id = actors.convention_id 
    AND role = 'establishment';
`);
  pgm.sql(`
    UPDATE conventions
    SET beneficiary_id = actors.id
    FROM actors
    WHERE conventions.id = actors.convention_id 
    AND role = 'beneficiary';
`);

  pgm.sql(`
    UPDATE conventions
    SET beneficiary_representative_id = actors.id
    FROM actors
    WHERE conventions.id = actors.convention_id 
    AND role = 'legal-representative';
`);

  await pgm.dropColumn("actors", "role");

  // Add NOT NULL constraint
  pgm.alterColumn("conventions", "mentor_id", { notNull: true });
  pgm.alterColumn("conventions", "beneficiary_id", { notNull: true });
  pgm.alterColumn("conventions", "establishment_representative_id", {
    notNull: true,
  });

  // Drop column convention_id (and views that depend on it )
  pgm.dropColumn("actors", "convention_id");

  // Recreate view
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

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("actors", "signatories");

  // Revert definition
  pgm.addColumns("signatories", {
    convention_id: {
      type: "uuid",
      references: "conventions",
      onDelete: "CASCADE",
    },
    role: {
      type: "text",
    },
  });

  // Migrate
  pgm.sql(`
    UPDATE signatories
    SET convention_id = conventions.id,
        role = 'establishment'
    FROM conventions
    WHERE 
        conventions.mentor_id = signatories.id OR
        conventions.establishment_representative_id = signatories.id
`);
  pgm.sql(`
    UPDATE signatories
    SET convention_id = conventions.id,
        role = 'beneficiary'
    FROM conventions
    WHERE 
      conventions.beneficiary_representative_id = signatories.id OR
      conventions.beneficiary_id = signatories.id
`);

  // Drop columns
  pgm.dropColumns("conventions", [
    "mentor_id",
    "beneficiary_id",
    "establishment_representative_id",
    "beneficiary_representative_id",
  ]);

  pgm.dropColumn("signatories", "id");

  // Recreate view

  // Improve view on conventions
  pgm.createView(
    "view_conventions",
    {},
    `
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
    `,
  );
}
