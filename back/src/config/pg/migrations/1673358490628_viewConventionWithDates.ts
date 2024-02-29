import { MigrationBuilder } from "node-pg-migrate";
const viewConventionsName = "view_conventions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  dropAndRecreateView(pgm, viewConventionsName, make_view_conventions("up"));
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  dropAndRecreateView(pgm, viewConventionsName, make_view_conventions("down"));
}

const make_view_conventions = (migrate: "up" | "down") => `
  SELECT c.id,
  a."Nom" AS "Structure",
  a."Type" AS "Type de structure",
  a."Département" AS "Département de la structure",
  a."Région" AS "Région de la structure",
  ${
    migrate === "up"
      ? `
      c.date_submission AS "Date de la demande",
      c.date_validation AS "Date de validation",
      `
      : `
      to_char(((c.date_submission)::date)::timestamp with time zone, 'dd/mm/yyyy'::text) AS "Date de la demande",
      to_char(((c.date_validation)::date)::timestamp with time zone, 'dd/mm/yyyy'::text) AS "Date de validation",
      `
  }
  c.status AS "Statut",
      CASE
          WHEN (er.signed_at IS NOT NULL) THEN 'Oui'::text
          ELSE 'Non'::text
      END AS "Accepté par l'entreprise",
      CASE
          WHEN (b.signed_at IS NOT NULL) THEN 'Oui'::text
          ELSE 'Non'::text
      END AS "Accepté par le bénéficiaire",
      CASE
          WHEN (c.beneficiary_representative_id IS NULL) THEN 'N/A'::text
          ELSE
          CASE
              WHEN (br.signed_at IS NOT NULL) THEN 'Oui'::text
              ELSE 'Non'::text
          END
      END AS "Accepté par le rep. légal du bénéfiaire",
      CASE
          WHEN (c.beneficiary_current_employer_id IS NULL) THEN 'N/A'::text
          ELSE
          CASE
              WHEN (bce.signed_at IS NOT NULL) THEN 'Oui'::text
              ELSE 'Non'::text
          END
      END AS "Accepté par l'employeur actuel du bénéficiaire",
  ${
    migrate === "up"
      ? `
        c.date_start AS "Date de début",
        c.date_end AS "Date de fin",
      `
      : `
        to_char(((c.date_start)::date)::timestamp with time zone, 'dd/mm/yyyy'::text) AS "Date de début",
        to_char(((c.date_end)::date)::timestamp with time zone, 'dd/mm/yyyy'::text) AS "Date de fin",
      `
  }
  c.immersion_objective AS "Objectif de l'immersion",
  pad.libelle_appellation_long AS "Métier observé",
  prd.code_rome AS "Rome du métier observé",
  c.work_conditions AS "Conditions de travail particulières",
  c.immersion_activities AS "Activités",
  c.immersion_skills AS "Compétences développées",
  (c.schedule -> 'complexSchedule'::text) AS "Programme",
  ((c.schedule -> 'workedDays'::text))::numeric AS "Total jours d'immersion",
  ((c.schedule -> 'totalHours'::text))::numeric AS "Total heures d'immersion",
  (regexp_match((c.immersion_address)::text, '\\d{5}'::text))[1] AS "Code Postal",
  concat(b.first_name, ' ', b.last_name) AS "Bénéficiaire",
  b.email AS "Email bénéficiaire",
  b.phone AS "Téléphone bénéficiaire",
  ${
    migrate === "up"
      ? `((b.extra_fields ->> 'birthdate'::text))::timestamptz AS "Date de naissance",`
      : `((b.extra_fields ->> 'birthdate'::text))::timestamp with time zone AS "Date de naissance",`
  }
  (b.extra_fields ->> 'emergencyContact'::text) AS "Contact d'urgence",
  (b.extra_fields ->> 'emergencyContactPhone'::text) AS "Téléphone du contact d'urgence",
  concat(br.first_name, ' ', br.last_name) AS "Rep. légal du bénéficiaire",
  br.email AS "Email rep. légal",
  br.phone AS "Téléphone rep. légal",
  concat(bce.first_name, ' ', bce.last_name) AS "Employeur actuel du bénéficiaire",
  bce.email AS "Email de l'employeur actuel du bénéficiaire",
  bce.phone AS "Téléphone de l'employeur actuel du bénéficiaire",
  c.individual_protection AS "Protection individuelle",
  c.sanitary_prevention AS "Prévention sanitaire",
  c.sanitary_prevention_description AS "Descriptif des préventions sanitaires",
  p.user_pe_external_id AS "Identifiant Externe Pole Emploi",
  c.siret AS "Siret",
      CASE
          WHEN (fe.siret IS NOT NULL) THEN 'Oui'::text
          ELSE 'Non'::text
      END AS "Référencement IF",
  fe.source AS "Source du référencement",
  c.business_name AS "Entreprise",
  concat(et.first_name, ' ', et.last_name, ' ', (et.extra_fields ->> 'job'::text)) AS "Tuteur de l'entreprise",
  et.phone AS "Téléphone du tuteur de l'entreprise",
  et.email AS "Email du tuteur de l'entreprise",
  concat(er.first_name, ' ', er.last_name) AS "Rep. de l'entreprise",
  er.phone AS "Téléphone du rep. de l'entreprise",
  er.email AS "Email du rep. de l'entreprise",
  ass.status AS "Issue de l'immersion",
  ass.created_at AS "Date du bilan",
  ass.establishment_feedback AS "Commentaire du bilan",
  a.id AS "StructureId",
  c.created_at AS "Date de création",
  c.updated_at AS "Date de mise à jour"
  FROM (((((((((((conventions c
  LEFT JOIN view_agencies a ON ((a.id = c.agency_id)))
  LEFT JOIN partners_pe_connect p ON ((p.convention_id = c.id)))
  LEFT JOIN public_appellations_data pad ON ((pad.ogr_appellation = c.immersion_appellation)))
  LEFT JOIN public_romes_data prd ON (((pad.code_rome)::bpchar = prd.code_rome)))
  LEFT JOIN form_establishments fe ON ((fe.siret = c.siret)))
  LEFT JOIN immersion_assessments ass ON ((ass.convention_id = c.id)))
  LEFT JOIN actors b ON ((c.beneficiary_id = b.id)))
  LEFT JOIN actors et ON ((c.establishment_tutor_id = et.id)))
  LEFT JOIN actors er ON ((c.establishment_representative_id = er.id)))
  LEFT JOIN actors br ON ((c.beneficiary_representative_id = br.id)))
  LEFT JOIN actors bce ON ((c.beneficiary_current_employer_id = bce.id)));
`;

const dropAndRecreateView = (
  pgm: MigrationBuilder,
  viewName: string,
  viewSql: string,
) => {
  pgm.dropView(viewName);
  pgm.createView(viewName, {}, viewSql);
};
