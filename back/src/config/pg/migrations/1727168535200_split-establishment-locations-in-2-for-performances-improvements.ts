import { MigrationBuilder } from "node-pg-migrate";

const establishmentsLocations = "establishments_locations";
const establishmentsLocationPositions = "establishments_location_positions";
const establishmentsLocationInfos = "establishments_location_infos";

export async function up(pgm: MigrationBuilder): Promise<void> {
  dropDependantViews(pgm);

  pgm.createTable(establishmentsLocationInfos, {
    id: {
      type: "UUID",
      primaryKey: true,
    },
    establishment_siret: {
      type: "CHAR(14)",
      notNull: true,
      references: "establishments",
      onDelete: "CASCADE",
    },
    post_code: {
      type: "TEXT",
      notNull: true,
    },
    city: {
      type: "TEXT",
      notNull: true,
    },
    street_number_and_address: {
      type: "TEXT",
      notNull: true,
    },
    department_code: {
      type: "TEXT",
      notNull: true,
    },
    lat: {
      type: "DOUBLE PRECISION",
      notNull: true,
    },
    lon: {
      type: "DOUBLE PRECISION",
      notNull: true,
    },
  });

  pgm.createTable(establishmentsLocationPositions, {
    id: {
      type: "UUID",
      primaryKey: true,
      references: establishmentsLocationInfos,
      onDelete: "CASCADE",
    },
    position: {
      type: "geography",
      notNull: true,
    },
  });

  pgm.addIndex(establishmentsLocationInfos, "establishment_siret");
  pgm.addIndex(establishmentsLocationPositions, "position", { method: "gist" });

  pgm.sql(`
    INSERT INTO ${establishmentsLocationInfos} (id, establishment_siret, post_code, city, street_number_and_address, department_code, lat, lon)
    SELECT id, establishment_siret, post_code, city, street_number_and_address, department_code, lat, lon
    FROM ${establishmentsLocations};
  `);

  pgm.sql(`
    INSERT INTO ${establishmentsLocationPositions} (id, position)
    SELECT id, position
    FROM ${establishmentsLocations};
  `);

  pgm.dropTable(establishmentsLocations);

  recreateDependantViews(pgm, "up");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  dropDependantViews(pgm);

  pgm.createTable(establishmentsLocations, {
    id: {
      type: "UUID",
      primaryKey: true,
    },
    position: {
      type: "geography",
      notNull: true,
    },
    establishment_siret: {
      type: "CHAR(14)",
      notNull: true,
      references: "establishments",
      onDelete: "CASCADE",
    },
    post_code: {
      type: "TEXT",
      notNull: true,
    },
    city: {
      type: "TEXT",
      notNull: true,
    },
    street_number_and_address: {
      type: "TEXT",
      notNull: true,
    },
    department_code: {
      type: "TEXT",
      notNull: true,
    },
    lat: {
      type: "DOUBLE PRECISION",
      notNull: true,
    },
    lon: {
      type: "DOUBLE PRECISION",
      notNull: true,
    },
  });

  pgm.sql(`
    insert into ${establishmentsLocations}
      ${queryMergingTables}                                           
  `);

  pgm.addIndex(establishmentsLocations, "position", { method: "gist" });
  pgm.addIndex(establishmentsLocations, "establishment_siret");

  pgm.dropTable(establishmentsLocationInfos);
  pgm.dropTable(establishmentsLocationPositions);

  recreateDependantViews(pgm, "down");
}

const queryMergingTables = `
    SELECT 
        ${establishmentsLocationPositions}.id as id,
        ${establishmentsLocationPositions}.position as position,
        ${establishmentsLocationInfos}.establishment_siret as establishment_siret,
        ${establishmentsLocationInfos}.post_code as post_code,
        ${establishmentsLocationInfos}.city as city,
        ${establishmentsLocationInfos}.street_number_and_address as street_number_and_address,
        ${establishmentsLocationInfos}.department_code as department_code,
        ${establishmentsLocationInfos}.lat as lat,
        ${establishmentsLocationInfos}.lon as lon
    FROM ${establishmentsLocationInfos}
    inner join ${establishmentsLocationPositions} 
        on ${establishmentsLocationInfos}.id = ${establishmentsLocationPositions}.id 
`;

const dropDependantViews = (pgm: MigrationBuilder) => {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");
  pgm.dropMaterializedView("view_siret_with_department_region");
  pgm.dropView("view_offers_from_form_establishment");
};

const recreateDependantViews = (
  pgm: MigrationBuilder,
  direction: Direction,
) => {
  createSDRView(pgm, direction);
  createEstablishmentsView(pgm, direction);
  createEstablishmentsWithAggredatedOffersView(pgm);
  createEstablishmentsWithFlattedOffersView(pgm);
  createOffersFromFormEstablishmentsView(pgm, direction);
};

type Direction = "up" | "down";

const leftJoinLoc = (direction: Direction) =>
  direction === "up"
    ? "LEFT JOIN establishments_location_infos loc ON loc.establishment_siret = e.siret"
    : "LEFT JOIN establishments_locations loc ON loc.establishment_siret = e.siret";

const createSDRView = (pgm: MigrationBuilder, direction: Direction) => {
  pgm.sql(`
      create materialized view view_siret_with_department_region as
      SELECT e.siret,
             pdr.department_name,
             pdr.region_name
      FROM establishments e
               ${leftJoinLoc(direction)}
               LEFT JOIN public_department_region pdr ON pdr.department_code = loc.department_code;
    `);
};

const createEstablishmentsView = (
  pgm: MigrationBuilder,
  direction: Direction,
) => {
  pgm.sql(`
  create materialized view view_establishments as
WITH count_conventions_by_siret AS (SELECT conventions.siret,
                                           count(*) AS count
                                    FROM conventions
                                    WHERE conventions.status::text =
                                          'ACCEPTED_BY_VALIDATOR'::text
                                    GROUP BY conventions.siret),
     count_contact_requests_by_siret
         AS (SELECT DISTINCT count(discussions.siret) AS count,
                             discussions.siret
             FROM discussions
             GROUP BY discussions.siret)
SELECT DISTINCT e.created_at                          AS "Date de référencement",
                e.update_date                         AS "Date de mise à jour",
                e.siret                               AS "Siret",
                e.name                                AS "Raison Sociale",
                e.customized_name                     AS "Enseigne",
                loc.street_number_and_address         AS "Adresse",
                loc.post_code                         AS "Code Postal",
                loc.city                              AS "Ville",
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
                concat(ec.firstname, ec.lastname)     AS "Contact",
                ec.job                                AS "Rôle du contact",
                ec.email                              AS "Email du contact",
                ec.phone                              AS "Téléphone du contact",
                CASE
                    WHEN ec.contact_mode = 'PHONE'::contact_mode
                        THEN 'Téléphone'::text
                    WHEN ec.contact_mode = 'IN_PERSON'::contact_mode
                        THEN 'En personne'::text
                    ELSE 'Email'::text
                    END                               AS "Mode de contact",
                CASE
                    WHEN e.is_commited THEN 'Oui'::text
                    ELSE 'Non déclaré'::text
                    END                               AS "Appartenance Réseau « Les entreprises s’engagent »",
                CASE
                    WHEN e.fit_for_disabled_workers THEN 'Oui'::text
                    ELSE 'Non'::text
                    END                                 AS "Accueil les personnes en situation de handicap",
                CASE
                    WHEN e.is_searchable THEN 'Oui'::text
                    ELSE 'Non'::text
                    END                               AS "Visible",
                e.source_provider                     AS "Origine",
                COALESCE(count_rel.count, 0::bigint)  AS "Nombre de mise en relation pour cette entreprise",
                COALESCE(count_conv.count, 0::bigint) AS "Nombre de convention validée pour cette entreprise"
FROM establishments e
         LEFT JOIN establishments_contacts ec ON e.siret = ec.siret
         LEFT JOIN view_siret_with_department_region sdr ON sdr.siret = e.siret
         LEFT JOIN public_naf_classes_2008 pnc ON pnc.class_id::text =
                                                  regexp_replace(
                                                          e.naf_code::text,
                                                          '(\\d{2})(\\d{2}).*'::text,
                                                          '\\1.\\2'::text)
         LEFT JOIN count_contact_requests_by_siret count_rel
                   ON count_rel.siret = e.siret
         LEFT JOIN count_conventions_by_siret count_conv
                   ON count_conv.siret = e.siret
         ${leftJoinLoc(direction)}
         ;
  `);
};

const createEstablishmentsWithAggredatedOffersView = (
  pgm: MigrationBuilder,
) => {
  pgm.sql(`
  create materialized view view_establishments_with_aggregated_offers as
WITH offers_by_siret AS (SELECT e.siret,
                                array_agg(pad.libelle_appellation_long) AS appelation_labels,
                                array_agg(io_1.rome_code)               AS rome_codes
                         FROM establishments e
                                  LEFT JOIN immersion_offers io_1 ON io_1.siret = e.siret
                                  LEFT JOIN public_appellations_data pad
                                            ON pad.code_rome::bpchar =
                                               io_1.rome_code AND
                                               pad.ogr_appellation =
                                               io_1.appellation_code
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
       view_establishments."Accueil les personnes en situation de handicap",
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

const createEstablishmentsWithFlattedOffersView = (pgm: MigrationBuilder) => {
  pgm.sql(`
  create materialized view view_establishments_with_flatten_offers as
WITH offers_by_siret AS (SELECT e.siret,
                                pad.libelle_appellation_long AS appelation_labels,
                                io_1.rome_code
                         FROM establishments e
                                  LEFT JOIN immersion_offers io_1 ON io_1.siret = e.siret
                                  LEFT JOIN public_appellations_data pad
                                            ON pad.code_rome::bpchar =
                                               io_1.rome_code AND
                                               pad.ogr_appellation =
                                               io_1.appellation_code)
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
       view_establishments."Accueil les personnes en situation de handicap",
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

const createOffersFromFormEstablishmentsView = (
  pgm: MigrationBuilder,
  direction: Direction,
) => {
  pgm.sql(`
  create view view_offers_from_form_establishment
            (update_date, name, rome_label, appellation_label, siret,
             post_code) as
SELECT io.update_date,
       e.name,
       vad.rome_label,
       vad.appellation_label,
       io.siret,
       loc.post_code
FROM immersion_offers io
         LEFT JOIN establishments e ON io.siret = e.siret
         LEFT JOIN view_appellations_dto vad
                   ON io.appellation_code = vad.appellation_code
         ${leftJoinLoc(direction)}
ORDER BY (ROW (io.update_date, e.name));
  `);
};
