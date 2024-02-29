import { MigrationBuilder } from "node-pg-migrate";

const conventionTable = "conventions";

const conventionStatusType = "convention_status_type";
const statusColumn = "status";
const allConventionStatuses = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "REJECTED",
  "CANCELLED",
  "DEPRECATED",
];

const conventionObjectiveType = "convention_objective_type";
const immersionObjectiveColumn = "immersion_objective";
const conventionObjectiveOptions = [
  "Confirmer un projet professionnel",
  "Découvrir un métier ou un secteur d'activité",
  "Initier une démarche de recrutement",
];

const conventionStatusTranslationsTable = "convention_status_translations";
const conventionStatusTranslationsStatusColumn = "status";

export async function up(pgm: MigrationBuilder): Promise<void> {
  dropViews(pgm);

  pgm.addType(conventionStatusType, allConventionStatuses);
  pgm.alterColumn(conventionTable, statusColumn, {
    type: conventionStatusType,
    using: `${statusColumn}::${conventionStatusType}`,
  });

  pgm.addType(conventionObjectiveType, conventionObjectiveOptions);
  pgm.alterColumn(conventionTable, immersionObjectiveColumn, {
    type: conventionObjectiveType,
    using: `${immersionObjectiveColumn}::${conventionObjectiveType}`,
  });

  pgm.alterColumn(
    conventionStatusTranslationsTable,
    conventionStatusTranslationsStatusColumn,
    {
      type: conventionStatusType,
      using: `${conventionStatusTranslationsStatusColumn}::${conventionStatusType}`,
    },
  );

  recreateViews(pgm);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  dropViews(pgm);

  pgm.alterColumn(conventionTable, statusColumn, {
    type: "varchar(255)",
    using: `${statusColumn}::varchar(255)`,
  });

  pgm.alterColumn(conventionTable, immersionObjectiveColumn, {
    type: "text",
    using: `${immersionObjectiveColumn}::text`,
  });
  pgm.dropType(conventionObjectiveType);

  pgm.alterColumn(
    conventionStatusTranslationsTable,
    conventionStatusTranslationsStatusColumn,
    {
      type: "text",
      using: `${conventionStatusTranslationsStatusColumn}::text`,
    },
  );
  pgm.dropType(conventionStatusType);

  recreateViews(pgm);
}

const dropViews = (pgm: MigrationBuilder) => {
  pgm.dropView("view_conventions", { ifExists: true });
  pgm.dropView("view_conventions_errored", { ifExists: true });
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers", {
    ifExists: true,
  });
  pgm.dropMaterializedView("view_establishments_with_flatten_offers", {
    ifExists: true,
  });
  pgm.dropMaterializedView("view_establishments", { ifExists: true });
};

const recreateViews = (pgm: MigrationBuilder) => {
  createViewConventions(pgm);
  createMaterializedViewEstablishments(pgm);
  createMaterializedViewEstablishmentsWithAggregatedOffers(pgm);
  createMaterializedViewEstablishmentsWithFlattenOffers(pgm);
  createViewConventionsErrored(pgm);
};

const createViewConventionsErrored = (pgm: MigrationBuilder) => {
  pgm.sql(`
  create view view_conventions_errored
            (id, message, "Structure", "Id Structure", "Département de l'agence", "Type d'agence", "Date de la demande",
             "Date de validation", "Statut", "Date de début", "Date de fin", "Objectif de l'immersion",
             "Métier observé", "Total heures d'immersion", "Accepté par le bénéficiaire", "Bénéficiaire",
             "Email bénéficiaire", "Téléphone bénéficiaire", "Date de naissance du bénéficiaire", "Siret", "Traité",
             occurred_at)
as
WITH ranked_errors AS (SELECT se.id,
                              se.service_name,
                              se.message,
                              se.params,
                              se.occurred_at,
                              se.handled_by_agency,
                              row_number()
                              OVER (PARTITION BY (se.params ->> 'conventionId'::text) ORDER BY se.occurred_at DESC) AS rn
                       FROM saved_errors se
                       WHERE (se.message = 'Identifiant National DE trouvé mais écart sur la date de naissance'::text OR
                              se.message = 'Identifiant National DE non trouvé'::text)
                         AND ((se.params ->> 'httpStatus'::text)::bigint) = 404
                         AND se.service_name = 'PoleEmploiGateway.notifyOnConventionUpdated'::text)
SELECT c.id,
       re.message,
       a.name                                                           AS "Structure",
       a.id                                                             AS "Id Structure",
       a.department_code                                                AS "Département de l'agence",
       a.kind                                                           AS "Type d'agence",
       c.date_submission                                                AS "Date de la demande",
       c.date_validation                                                AS "Date de validation",
       c.status                                                         AS "Statut",
       c.date_start                                                     AS "Date de début",
       c.date_end                                                       AS "Date de fin",
       c.immersion_objective                                            AS "Objectif de l'immersion",
       pad.libelle_appellation_long                                     AS "Métier observé",
       (c.schedule -> 'totalHours'::text)::numeric                      AS "Total heures d'immersion",
       CASE
           WHEN b.signed_at IS NOT NULL THEN 'Oui'::text
           ELSE 'Non'::text
           END                                                          AS "Accepté par le bénéficiaire",
       concat(b.first_name, ' ', b.last_name)                           AS "Bénéficiaire",
       b.email                                                          AS "Email bénéficiaire",
       b.phone                                                          AS "Téléphone bénéficiaire",
       (b.extra_fields ->> 'birthdate'::text)::timestamp with time zone AS "Date de naissance du bénéficiaire",
       c.siret                                                          AS "Siret",
       re.handled_by_agency                                             AS "Traité",
       re.occurred_at
FROM ranked_errors re
         LEFT JOIN conventions c ON c.id = ((re.params ->> 'conventionId'::text)::uuid)
         LEFT JOIN agencies a ON a.id = c.agency_id
         LEFT JOIN public_appellations_data pad ON pad.ogr_appellation = c.immersion_appellation
         LEFT JOIN actors b ON c.beneficiary_id = b.id
WHERE re.rn = 1;
  `);
};
const createViewConventions = (pgm: MigrationBuilder) => {
  pgm.sql(`
  create view view_conventions
            (id, "Structure", "Type de structure", "Département de la structure", "Région de la structure",
             "Date de la demande", "Date de validation", "Statut", "Accepté par l'entreprise",
             "Accepté par le bénéficiaire", "Accepté par le rep. légal du bénéfiaire",
             "Accepté par l'employeur actuel du bénéficiaire", "Date de début", "Date de fin",
             "Objectif de l'immersion", "Métier observé", "Rome du métier observé",
             "Conditions de travail particulières", "Activités", "Compétences développées", "Programme",
             "Total jours d'immersion", "Total heures d'immersion", "Code Postal", "Bénéficiaire", "Email bénéficiaire",
             "Téléphone bénéficiaire", "Date de naissance", "Contact d'urgence", "Téléphone du contact d'urgence",
             "Rep. légal du bénéficiaire", "Email rep. légal", "Téléphone rep. légal",
             "Employeur actuel du bénéficiaire", "Email de l'employeur actuel du bénéficiaire",
             "Téléphone de l'employeur actuel du bénéficiaire", "Protection individuelle", "Prévention sanitaire",
             "Descriptif des préventions sanitaires", "Identifiant Externe Pole Emploi", "Siret", "Référencement IF",
             "Source du référencement", "Entreprise", "Tuteur de l'entreprise", "Téléphone du tuteur de l'entreprise",
             "Email du tuteur de l'entreprise", "Rep. de l'entreprise", "Téléphone du rep. de l'entreprise",
             "Email du rep. de l'entreprise", "Issue de l'immersion", "Date du bilan", "Commentaire du bilan",
             "StructureId", "Date de création", "Date de mise à jour")
as
SELECT c.id,
       a."Nom"                                                                        AS "Structure",
       a."Type"                                                                       AS "Type de structure",
       a."Département"                                                                AS "Département de la structure",
       a."Région"                                                                     AS "Région de la structure",
       c.date_submission                                                              AS "Date de la demande",
       c.date_validation                                                              AS "Date de validation",
       cst.translation                                                                AS "Statut",
       CASE
           WHEN er.signed_at IS NOT NULL THEN 'Oui'::text
           ELSE 'Non'::text
           END                                                                        AS "Accepté par l'entreprise",
       CASE
           WHEN b.signed_at IS NOT NULL THEN 'Oui'::text
           ELSE 'Non'::text
           END                                                                        AS "Accepté par le bénéficiaire",
       CASE
           WHEN c.beneficiary_representative_id IS NULL THEN 'N/A'::text
           ELSE
               CASE
                   WHEN br.signed_at IS NOT NULL THEN 'Oui'::text
                   ELSE 'Non'::text
                   END
           END                                                                        AS "Accepté par le rep. légal du bénéfiaire",
       CASE
           WHEN c.beneficiary_current_employer_id IS NULL THEN 'N/A'::text
           ELSE
               CASE
                   WHEN bce.signed_at IS NOT NULL THEN 'Oui'::text
                   ELSE 'Non'::text
                   END
           END                                                                        AS "Accepté par l'employeur actuel du bénéficiaire",
       c.date_start                                                                   AS "Date de début",
       c.date_end                                                                     AS "Date de fin",
       c.immersion_objective                                                          AS "Objectif de l'immersion",
       pad.libelle_appellation_long                                                   AS "Métier observé",
       prd.code_rome                                                                  AS "Rome du métier observé",
       c.work_conditions                                                              AS "Conditions de travail particulières",
       c.immersion_activities                                                         AS "Activités",
       c.immersion_skills                                                             AS "Compétences développées",
       c.schedule -> 'complexSchedule'::text                                          AS "Programme",
       (c.schedule -> 'workedDays'::text)::numeric                                    AS "Total jours d'immersion",
       (c.schedule -> 'totalHours'::text)::numeric                                    AS "Total heures d'immersion",
       (regexp_match(c.immersion_address::text, '\\d{5}'::text))[1]                    AS "Code Postal",
       concat(b.first_name, ' ', b.last_name)                                         AS "Bénéficiaire",
       b.email                                                                        AS "Email bénéficiaire",
       b.phone                                                                        AS "Téléphone bénéficiaire",
       (b.extra_fields ->> 'birthdate'::text)::timestamp with time zone               AS "Date de naissance",
       b.extra_fields ->> 'emergencyContact'::text                                    AS "Contact d'urgence",
       b.extra_fields ->> 'emergencyContactPhone'::text                               AS "Téléphone du contact d'urgence",
       concat(br.first_name, ' ', br.last_name)                                       AS "Rep. légal du bénéficiaire",
       br.email                                                                       AS "Email rep. légal",
       br.phone                                                                       AS "Téléphone rep. légal",
       concat(bce.first_name, ' ', bce.last_name)                                     AS "Employeur actuel du bénéficiaire",
       bce.email                                                                      AS "Email de l'employeur actuel du bénéficiaire",
       bce.phone                                                                      AS "Téléphone de l'employeur actuel du bénéficiaire",
       c.individual_protection                                                        AS "Protection individuelle",
       c.sanitary_prevention                                                          AS "Prévention sanitaire",
       c.sanitary_prevention_description                                              AS "Descriptif des préventions sanitaires",
       p.user_pe_external_id                                                          AS "Identifiant Externe Pole Emploi",
       c.siret                                                                        AS "Siret",
       CASE
           WHEN fe.siret IS NOT NULL THEN 'Oui'::text
           ELSE 'Non'::text
           END                                                                        AS "Référencement IF",
       fe.source                                                                      AS "Source du référencement",
       c.business_name                                                                AS "Entreprise",
       concat(et.first_name, ' ', et.last_name, ' ', et.extra_fields ->> 'job'::text) AS "Tuteur de l'entreprise",
       et.phone                                                                       AS "Téléphone du tuteur de l'entreprise",
       et.email                                                                       AS "Email du tuteur de l'entreprise",
       concat(er.first_name, ' ', er.last_name)                                       AS "Rep. de l'entreprise",
       er.phone                                                                       AS "Téléphone du rep. de l'entreprise",
       er.email                                                                       AS "Email du rep. de l'entreprise",
       ass.status                                                                     AS "Issue de l'immersion",
       ass.created_at                                                                 AS "Date du bilan",
       ass.establishment_feedback                                                     AS "Commentaire du bilan",
       a.id                                                                           AS "StructureId",
       c.created_at                                                                   AS "Date de création",
       c.updated_at                                                                   AS "Date de mise à jour"
FROM conventions c
         LEFT JOIN view_agencies a ON a.id = c.agency_id
         LEFT JOIN partners_pe_connect p ON p.convention_id = c.id
         LEFT JOIN public_appellations_data pad ON pad.ogr_appellation = c.immersion_appellation
         LEFT JOIN public_romes_data prd ON pad.code_rome::bpchar = prd.code_rome
         LEFT JOIN form_establishments fe ON fe.siret = c.siret
         LEFT JOIN immersion_assessments ass ON ass.convention_id = c.id
         LEFT JOIN actors b ON c.beneficiary_id = b.id
         LEFT JOIN actors et ON c.establishment_tutor_id = et.id
         LEFT JOIN actors er ON c.establishment_representative_id = er.id
         LEFT JOIN actors br ON c.beneficiary_representative_id = br.id
         LEFT JOIN convention_status_translations cst ON c.status = cst.status
         LEFT JOIN actors bce ON c.beneficiary_current_employer_id = bce.id;`);
};

const createMaterializedViewEstablishmentsWithFlattenOffers = (
  pgm: MigrationBuilder,
) => {
  pgm.sql(`
  create materialized view view_establishments_with_flatten_offers as
WITH offers_by_siret AS (SELECT e.siret,
                                pad.libelle_appellation_long AS appelation_labels,
                                io_1.rome_code
                         FROM establishments e
                                  LEFT JOIN immersion_offers io_1 ON io_1.siret = e.siret
                                  LEFT JOIN public_appellations_data pad ON pad.code_rome::bpchar = io_1.rome_code AND
                                                                            pad.ogr_appellation = io_1.appellation_code)
SELECT view_establishments."Date de référencement",
       view_establishments."Date de mise à jour",
       view_establishments."Siret",
       view_establishments."Raison Sociale",
       view_establishments."Enseigne",
       view_establishments."Adresse",
       view_establishments."Code Postal",
       view_establishments."Ville",
       view_establishments."Département",
       view_establishments."Région",
       view_establishments."NAF",
       view_establishments."Id Classe NAF",
       view_establishments."Classe NAF",
       view_establishments."Id Groupe NAF",
       view_establishments."Groupe NAF",
       view_establishments."Id Division NAF",
       view_establishments."Division NAF",
       view_establishments."Id Section NAF",
       view_establishments."Section NAF",
       view_establishments."Nombre d’employés",
       view_establishments."Contact",
       view_establishments."Rôle du contact",
       view_establishments."Email du contact",
       view_establishments."Téléphone du contact",
       view_establishments."Mode de contact",
       view_establishments."Appartenance Réseau « Les entreprises s’engagent »",
       view_establishments."Visible",
       view_establishments."Origine",
       view_establishments."Nombre de mise en relation pour cette entreprise",
       view_establishments."Nombre de convention validée pour cette entreprise",
       io.rome_code         AS "Code Métier",
       io.appelation_labels AS "Métier"
FROM view_establishments
         LEFT JOIN offers_by_siret io ON io.siret = view_establishments."Siret";
  `);
};

const createMaterializedViewEstablishmentsWithAggregatedOffers = (
  pgm: MigrationBuilder,
) => {
  pgm.sql(`
  create materialized view view_establishments_with_aggregated_offers as
WITH offers_by_siret AS (SELECT e.siret,
                                array_agg(pad.libelle_appellation_long) AS appelation_labels,
                                array_agg(io_1.rome_code)               AS rome_codes
                         FROM establishments e
                                  LEFT JOIN immersion_offers io_1 ON io_1.siret = e.siret
                                  LEFT JOIN public_appellations_data pad ON pad.code_rome::bpchar = io_1.rome_code AND
                                                                            pad.ogr_appellation = io_1.appellation_code
                         GROUP BY e.siret)
SELECT view_establishments."Date de référencement",
       view_establishments."Date de mise à jour",
       view_establishments."Siret",
       view_establishments."Raison Sociale",
       view_establishments."Enseigne",
       view_establishments."Adresse",
       view_establishments."Code Postal",
       view_establishments."Ville",
       view_establishments."Département",
       view_establishments."Région",
       view_establishments."NAF",
       view_establishments."Id Classe NAF",
       view_establishments."Classe NAF",
       view_establishments."Id Groupe NAF",
       view_establishments."Groupe NAF",
       view_establishments."Id Division NAF",
       view_establishments."Division NAF",
       view_establishments."Id Section NAF",
       view_establishments."Section NAF",
       view_establishments."Nombre d’employés",
       view_establishments."Contact",
       view_establishments."Rôle du contact",
       view_establishments."Email du contact",
       view_establishments."Téléphone du contact",
       view_establishments."Mode de contact",
       view_establishments."Appartenance Réseau « Les entreprises s’engagent »",
       view_establishments."Visible",
       view_establishments."Origine",
       view_establishments."Nombre de mise en relation pour cette entreprise",
       view_establishments."Nombre de convention validée pour cette entreprise",
       io.rome_codes        AS "Codes Métier",
       io.appelation_labels AS "Métiers"
FROM view_establishments
         LEFT JOIN offers_by_siret io ON io.siret = view_establishments."Siret";
  `);
};

const createMaterializedViewEstablishments = (pgm: MigrationBuilder) => {
  pgm.sql(`
  create materialized view view_establishments as
WITH count_conventions_by_siret AS (SELECT conventions.siret,
                                           count(*) AS count
                                    FROM conventions
                                    WHERE conventions.status::text = 'ACCEPTED_BY_VALIDATOR'::text
                                    GROUP BY conventions.siret),
     count_contact_requests_by_siret AS (SELECT DISTINCT count(discussions.siret) AS count,
                                                         discussions.siret
                                         FROM discussions
                                         GROUP BY discussions.siret)
SELECT DISTINCT e.created_at                          AS "Date de référencement",
                e.update_date                         AS "Date de mise à jour",
                e.siret                               AS "Siret",
                e.name                                AS "Raison Sociale",
                e.customized_name                     AS "Enseigne",
                e.street_number_and_address           AS "Adresse",
                e.post_code                           AS "Code Postal",
                e.city                                AS "Ville",
                sdr.department_name                   AS "Département",
                sdr.region_name                       AS "Région",
                e.naf_code                            AS "NAF",
                pnc.class_id                          AS "Id Classe NAF",
                pnc.class_label                       AS "Classe NAF",
                pnc.group_id                          AS "Id Groupe NAF",
                pnc.group_label                       AS "Groupe NAF",
                pnc.division_id                       AS "Id Division NAF",
                pnc.division_label                    AS "Division NAF",
                pnc.section_id                        AS "Id Section NAF",
                pnc.section_label                     AS "Section NAF",
                e.number_employees                    AS "Nombre d’employés",
                concat(ic.firstname, ic.lastname)     AS "Contact",
                ic.job                                AS "Rôle du contact",
                ic.email                              AS "Email du contact",
                ic.phone                              AS "Téléphone du contact",
                CASE
                    WHEN ic.contact_mode = 'PHONE'::contact_mode THEN 'Téléphone'::text
                    WHEN ic.contact_mode = 'IN_PERSON'::contact_mode THEN 'En personne'::text
                    ELSE 'Email'::text
                    END                               AS "Mode de contact",
                CASE
                    WHEN e.is_commited THEN 'Oui'::text
                    ELSE 'Non déclaré'::text
                    END                               AS "Appartenance Réseau « Les entreprises s’engagent »",
                CASE
                    WHEN e.is_searchable THEN 'Oui'::text
                    ELSE 'Non'::text
                    END                               AS "Visible",
                e.source_provider                     AS "Origine",
                COALESCE(count_rel.count, 0::bigint)  AS "Nombre de mise en relation pour cette entreprise",
                COALESCE(count_conv.count, 0::bigint) AS "Nombre de convention validée pour cette entreprise"
FROM establishments e
         LEFT JOIN establishments__immersion_contacts eic ON eic.establishment_siret = e.siret
         LEFT JOIN immersion_contacts ic ON eic.contact_uuid = ic.uuid
         LEFT JOIN view_siret_with_department_region sdr ON sdr.siret = e.siret
         LEFT JOIN public_naf_classes_2008 pnc
                   ON pnc.class_id::text = regexp_replace(e.naf_code::text, '(\\d\\d)(\\d\\d)(\\w)'::text, '\\1.\\2'::text)
         LEFT JOIN count_contact_requests_by_siret count_rel ON count_rel.siret = e.siret
         LEFT JOIN count_conventions_by_siret count_conv ON count_conv.siret = e.siret;
  `);
};
