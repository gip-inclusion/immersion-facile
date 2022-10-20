/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const old_SQL_view_contact_requests = `
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

const new_SQL_view_contact_requests = `
WITH outbox_contact_requests AS (
  SELECT 
    TO_CHAR(outbox.occurred_at::date, 'dd/mm/yyyy') AS "Date de la mise en relation",
    (outbox.payload ->> 'contactMode'::text) AS "Type de mise en relation",
    (outbox.payload ->> 'potentialBeneficiaryEmail'::text) AS "Email",
    (outbox.payload ->> 'siret'::text) AS "Siret",
    (outbox.payload -> 'offer' ->> 'romeLabel' ::text) AS "Métier"
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
  await migrateOutboxContent(pgm);
  await dropEstablishmentViews(pgm);
  pgm.dropMaterializedView("view_contact_requests");
  pgm.createMaterializedView(
    "view_contact_requests",
    {},
    new_SQL_view_contact_requests,
  );
  await recreateEstablishmentViews(pgm);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await revertOutboxContent(pgm);
  await dropEstablishmentViews(pgm);
  pgm.dropMaterializedView("view_contact_requests");
  pgm.createMaterializedView(
    "view_contact_requests",
    {},
    old_SQL_view_contact_requests,
  );
  await recreateEstablishmentViews(pgm);
}

const dropEstablishmentViews = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");
};

const migrateOutboxContent = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.sql(`WITH outbox_with_code AS (
    SELECT id, libelle_rome, code_rome FROM outbox 
    left join public_romes_data prd on prd.libelle_rome = (outbox.payload ->> 'romeLabel')::text
    WHERE topic = 'ContactRequestedByBeneficiary'
    )
    UPDATE outbox 
    SET payload = JSON_BUILD_OBJECT('siret', payload ->> 'siret',  'message', payload ->> 'message', 'offer', JSON_BUILD_OBJECT('romeCode', code_rome , 'romeLabel', libelle_rome), 
                                     'potentialBeneficiaryEmail', payload ->> 'potentialBeneficiaryEmail', 'potentialBeneficiaryLastName', payload ->> 'potentialBeneficiaryLastName', 
                                     'potentialBeneficiaryFirstName', payload ->> 'potentialBeneficiaryFirstName',
                                     'contactMode', payload ->> 'contactMode')
    FROM outbox_with_code 
    WHERE outbox.id = outbox_with_code.id;
    `);
};

const revertOutboxContent = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.sql(`
    UPDATE outbox 
    SET payload = JSON_BUILD_OBJECT('siret', payload ->> 'siret',  'message', payload ->> 'message', 'romeLabel',  payload -> 'offer' ->> 'romeLabel', 
                                     'potentialBeneficiaryEmail', payload ->> 'potentialBeneficiaryEmail', 'potentialBeneficiaryLastName', payload ->> 'potentialBeneficiaryLastName', 
                                     'potentialBeneficiaryFirstName', payload ->> 'potentialBeneficiaryFirstName',
                                     'contactMode', payload ->> 'contactMode') 
    WHERE topic = 'ContactRequestedByBeneficiary'
    `);
};

const recreateEstablishmentViews = async (
  pgm: MigrationBuilder,
): Promise<void> => {
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
};
