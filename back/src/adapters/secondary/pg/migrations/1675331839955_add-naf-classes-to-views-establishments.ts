/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";
const viewEstablishments = "view_establishments";
const viewEstablishmentsWithAggregatedOffers =
  "view_establishments_with_aggregated_offers";
const viewEstablishmentWithFlattenOffers =
  "view_establishments_with_flatten_offers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView(viewEstablishmentsWithAggregatedOffers);
  pgm.dropMaterializedView(viewEstablishmentWithFlattenOffers);
  pgm.dropMaterializedView(viewEstablishments);

  pgm.createMaterializedView(
    viewEstablishments,
    {},
    establishmentViewWithNafColumns,
  );
  pgm.createMaterializedView(
    viewEstablishmentsWithAggregatedOffers,
    {},
    view_establishments_with_aggregated_offers_with_new_columns_sql,
  );
  pgm.createMaterializedView(
    viewEstablishmentWithFlattenOffers,
    {},
    view_establishments_with_flatten_offers_with_new_columns_sql,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView(viewEstablishmentsWithAggregatedOffers);
  pgm.dropMaterializedView(viewEstablishmentWithFlattenOffers);
  pgm.dropMaterializedView(viewEstablishments);

  pgm.createMaterializedView(
    viewEstablishments,
    {},
    establishmentViewWithoutNewColumns,
  );
  pgm.createMaterializedView(
    viewEstablishmentsWithAggregatedOffers,
    {},
    view_establishments_with_aggregated_offers_without_new_columns_sql,
  );
  pgm.createMaterializedView(
    viewEstablishmentWithFlattenOffers,
    {},
    view_establishments_with_flatten_offers_without_new_columns_sql,
  );
}

const establishmentViewWithNafColumns = `
  WITH 
    count_conventions_by_siret AS (
        SELECT siret, count(*) 
        FROM conventions WHERE status = 'ACCEPTED_BY_VALIDATOR' 
        GROUP BY siret
        ),
    count_contact_requests_by_siret AS (
        SELECT count (distinct ("Email", "Code métier")), "Siret"
        FROM view_contact_requests
        GROUP BY  "Siret"
        )
    SELECT 
        e.created_at AS "Date de référencement",
        e.update_date AS "Date de mise à jour",
        e.siret AS "Siret", 
        name AS "Raison Sociale",
        customized_name AS "Enseigne", 
        street_number_and_address AS "Adresse",
        post_code AS "Code Postal",
        city AS "Ville",
        sdr.department_name AS "Département",
        sdr.region_name AS "Région",
        naf_code AS "NAF",
        pnc.class_id AS "Id Classe NAF",
        pnc.class_label AS "Classe NAF",
        pnc.group_id AS "Id Groupe NAF",
        pnc.group_label AS "Groupe NAF",
        pnc.division_id AS "Id Division NAF",
        pnc.division_label AS "Division NAF",
        pnc.section_id AS "Id Section NAF",
        pnc.section_label AS "Section NAF",
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
    WHERE data_source = 'form'`;

const view_establishments_with_aggregated_offers_with_new_columns_sql = `
  WITH offers_by_siret AS (
    SELECT e.siret,
      array_agg(pad.libelle_appellation_long) AS appelation_labels,
      array_agg(io_1.rome_code) AS rome_codes
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        LEFT JOIN public_appellations_data pad ON ((((pad.code_rome)::bpchar = io_1.rome_code) AND (pad.ogr_appellation = io_1.rome_appellation))))
    WHERE (e.data_source = 'form'::text)
    GROUP BY e.siret
  )
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
  io.rome_codes AS "Codes Métier",
  io.appelation_labels AS "Métiers"
  FROM (view_establishments
  LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
`;

const view_establishments_with_flatten_offers_with_new_columns_sql = `
  WITH offers_by_siret AS (
    SELECT e.siret,
      pad.libelle_appellation_long AS appelation_labels,
      io_1.rome_code
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        LEFT JOIN public_appellations_data pad ON ((pad.code_rome = io_1.rome_code AND pad.ogr_appellation = io_1.rome_appellation)))
    WHERE (e.data_source = 'form'::text)
  )
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
  io.rome_code AS "Code Métier",
  io.appelation_labels AS "Métier"
  FROM (view_establishments
  LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
`;

const establishmentViewWithoutNewColumns = `
  WITH 
    count_conventions_by_siret AS (
        SELECT siret, count(*) 
        FROM conventions WHERE status = 'ACCEPTED_BY_VALIDATOR' 
        GROUP BY siret
        ),
    count_contact_requests_by_siret AS (
        SELECT count (distinct ("Email", "Code métier")), "Siret"
        FROM view_contact_requests
        GROUP BY  "Siret"
        )
    SELECT 
        e.created_at AS "Date de référencement",
        e.update_date AS "Date de mise à jour",
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
    WHERE data_source = 'form'`;

const view_establishments_with_aggregated_offers_without_new_columns_sql = `
  WITH offers_by_siret AS (
    SELECT e.siret,
      array_agg(pad.libelle_appellation_long) AS appelation_labels,
      array_agg(io_1.rome_code) AS rome_codes
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        LEFT JOIN public_appellations_data pad ON ((((pad.code_rome)::bpchar = io_1.rome_code) AND (pad.ogr_appellation = io_1.rome_appellation))))
    WHERE (e.data_source = 'form'::text)
    GROUP BY e.siret
  )
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
  view_establishments."Division NAF",
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
  io.rome_codes AS "Codes Métier",
  io.appelation_labels AS "Métiers"
  FROM (view_establishments
  LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
`;

const view_establishments_with_flatten_offers_without_new_columns_sql = `
  WITH offers_by_siret AS (
    SELECT e.siret,
      pad.libelle_appellation_long AS appelation_labels,
      io_1.rome_code
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        LEFT JOIN public_appellations_data pad ON ((pad.code_rome = io_1.rome_code AND pad.ogr_appellation = io_1.rome_appellation)))
    WHERE (e.data_source = 'form'::text)
  )
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
  view_establishments."Division NAF",
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
  io.rome_code AS "Code Métier",
  io.appelation_labels AS "Métier"
  FROM (view_establishments
  LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
`;
