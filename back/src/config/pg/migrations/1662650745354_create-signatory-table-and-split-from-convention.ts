import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("signatories", {
    convention_id: {
      type: "uuid",
      notNull: true,
      references: "conventions",
      onDelete: "CASCADE",
    },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
    email: { type: "text", notNull: true },
    phone: { type: "text", notNull: true },
    role: { type: "text", notNull: true },
    signed_at: { type: "timestamptz", notNull: false },
    extra_fields: { type: "jsonb", notNull: false },
  });

  pgm.addConstraint("signatories", "signatories_unicity", {
    unique: ["convention_id", "role"],
  });

  await pgm.sql(`
  INSERT INTO signatories
  SELECT id, first_name, last_name, email, phone, 'beneficiary', 
  (CASE WHEN beneficiary_accepted THEN updated_at ELSE NULL END ),
  JSON_BUILD_OBJECT('emergencyContact', emergency_contact, 'emergencyContactPhone', emergency_contact_phone)
  FROM conventions`);

  await pgm.sql(`
  INSERT INTO signatories
  SELECT id, mentor, '-', mentor_email, mentor_phone, 'establishment', 
  (CASE WHEN enterprise_accepted THEN updated_at ELSE NULL END ),
  JSON_BUILD_OBJECT('job', '-')
  FROM conventions`);

  pgm.dropView("view_daily_immersion_application_events", { ifExists: true });
  pgm.dropView("view_application_avancement", { ifExists: true });
  pgm.dropView("view_conventions");

  pgm.createView(
    "view_conventions",
    {},
    `WITH 
    convention_beneficiary AS (
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

  pgm.dropColumns("conventions", [
    "first_name",
    "last_name",
    "email",
    "phone",
    "mentor",
    "mentor_phone",
    "mentor_email",
    "beneficiary_accepted",
    "enterprise_accepted",
    "emergency_contact",
    "emergency_contact_phone",
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Restore previous columns and data
  pgm.addColumns("conventions", {
    first_name: { type: "text", notNull: true, default: "" },
    last_name: { type: "text", notNull: true, default: "" },
    email: { type: "text", notNull: true, default: "" },
    phone: { type: "text", notNull: true, default: "" },
    emergency_contact: { type: "text", notNull: true, default: "" },
    emergency_contact_phone: { type: "text", notNull: true, default: "" },
    mentor: { type: "text", notNull: true, default: "" },
    mentor_phone: { type: "text", notNull: true, default: "" },
    mentor_email: { type: "text", notNull: true, default: "" },
    beneficiary_accepted: { type: "bool", notNull: true, default: false },
    enterprise_accepted: { type: "bool", notNull: true, default: false },
  });

  await pgm.sql(`
  UPDATE conventions AS c
  SET 
    first_name = s.first_name,
    last_name = s.last_name,
    email = s.email, 
    phone = s.phone,
    emergency_contact = s.extra_fields ->> 'emergencyContact',
    emergency_contact_phone = s.extra_fields ->> 'emergencyContactPhone',
    beneficiary_accepted = (signed_at IS NOT NULL)::bool
  FROM signatories AS s
  WHERE s.convention_id = c.id AND role = 'beneficiary'`);

  await pgm.sql(`
  UPDATE conventions AS c
  SET 
    mentor = CONCAT(s.first_name, ' ',  s.last_name, ' ', s.extra_fields ->> 'job'),
    mentor_email = s.email, 
    mentor_phone = s.phone,
    enterprise_accepted = (signed_at IS NOT NULL)::bool
  FROM signatories AS s
  WHERE s.convention_id = c.id AND role = 'establishment'`);

  // Restore previous views
  pgm.dropView("view_conventions");
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

  // Drop table
  pgm.dropTable("signatories");
}
