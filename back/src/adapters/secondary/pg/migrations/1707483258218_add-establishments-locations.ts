import { MigrationBuilder } from "node-pg-migrate";

const establishmentsTableName = "establishments";
const establishmentsLocationsTableName = `${establishmentsTableName}_locations`;
const joinTableName = `${establishmentsTableName}__${establishmentsLocationsTableName}`;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");
  pgm.dropMaterializedView("view_siret_with_department_region");
  pgm.dropView("view_offers_from_form_establishment");
  // create new tables
  pgm.createTable(establishmentsLocationsTableName, {
    id: {
      type: "UUID",
      primaryKey: true,
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
    position: {
      type: "GEOGRAPHY(POINT)",
      notNull: true,
    },
    temp_siret: {
      type: "VARCHAR(14)",
      notNull: true,
      references: establishmentsTableName,
    },
  });
  pgm.createTable(joinTableName, {
    establishment_siret: {
      type: "VARCHAR(14)",
      notNull: true,
      references: "establishments",
    },
    location_id: {
      type: "UUID",
      notNull: true,
      references: establishmentsLocationsTableName,
    },
  });

  // add constraints to make sure the join table is unique
  pgm.addConstraint(joinTableName, "unique_establishment_siret_location_id", {
    unique: ["establishment_siret", "location_id"],
  });
  pgm.addIndex(joinTableName, "establishment_siret");
  pgm.addIndex(joinTableName, "location_id");

  // enable uuid_generate_v4 extension
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // populate establishments_locations from establishments old columns, set lat and lon from gps col
  pgm.sql(`
    INSERT INTO ${establishmentsLocationsTableName} (id, post_code, city, street_number_and_address, department_code, lat, lon, position, temp_siret)
    SELECT uuid_generate_v4(), post_code, city, street_number_and_address, department_code, lat, lon, gps, siret
    FROM ${establishmentsTableName}
  `);
  // populate join table
  pgm.sql(`
    INSERT INTO ${joinTableName} (establishment_siret, location_id)
    SELECT temp_siret, id
    FROM ${establishmentsLocationsTableName}
  `);

  // drop old columns
  pgm.dropColumn(establishmentsTableName, [
    "post_code",
    "city",
    "street_number_and_address",
    "department_code",
    "gps",
  ]);
  pgm.dropColumn(establishmentsLocationsTableName, "temp_siret");
  createSDRView(pgm, "up");
  createEstablishmentsView(pgm, "up");
  createEstablishmentsWithAggredatedOffersView(pgm);
  createEstablishmentsWithFlattedOffersView(pgm);
  createOffersFromFormEstablishmentsView(pgm, "up");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");
  pgm.dropMaterializedView("view_siret_with_department_region");
  pgm.dropView("view_offers_from_form_establishment");

  // recreate old columns
  pgm.addColumns(establishmentsTableName, {
    post_code: {
      type: "TEXT",
      notNull: false,
    },
    city: {
      type: "TEXT",
      notNull: false,
    },
    street_number_and_address: {
      type: "TEXT",
      notNull: false,
    },
    department_code: {
      type: "TEXT",
      notNull: false,
    },
    gps: {
      type: "GEOGRAPHY(POINT)",
      notNull: false,
    },
  });

  // update establishments from establishments_locations old columns based on the join table
  pgm.sql(`
    UPDATE ${establishmentsTableName}
    SET post_code = el.post_code,
      city = el.city,
      street_number_and_address = el.street_number_and_address,
      department_code = el.department_code,
      gps = el.position
    FROM ${establishmentsLocationsTableName} el, ${joinTableName}
    WHERE ${establishmentsTableName}.siret = ${joinTableName}.establishment_siret
      AND el.id = ${joinTableName}.location_id
  `);

  // add not null constraints
  pgm.alterColumn(establishmentsTableName, "post_code", {
    notNull: true,
  });
  pgm.alterColumn(establishmentsTableName, "city", {
    notNull: true,
  });
  pgm.alterColumn(establishmentsTableName, "street_number_and_address", {
    notNull: true,
  });
  pgm.alterColumn(establishmentsTableName, "department_code", {
    notNull: true,
  });
  pgm.alterColumn(establishmentsTableName, "gps", {
    notNull: true,
  });

  // drop new columns
  pgm.dropTable(joinTableName);
  pgm.dropTable(establishmentsLocationsTableName);
  createSDRView(pgm, "down");
  createEstablishmentsView(pgm, "down");
  createEstablishmentsWithAggredatedOffersView(pgm);
  createEstablishmentsWithFlattedOffersView(pgm);
  createOffersFromFormEstablishmentsView(pgm, "down");
}

const createSDRView = (pgm: MigrationBuilder, direction: "up" | "down") => {
  if (direction === "down") {
    pgm.sql(`
    CREATE MATERIALIZED VIEW view_siret_with_department_region AS
    SELECT e.siret,
    pdr.department_name,
    pdr.region_name
   FROM (establishments e
     LEFT JOIN public_department_region pdr ON ((pdr.department_code = e.department_code)));
    `);
  } else {
    pgm.sql(`
      CREATE MATERIALIZED VIEW view_siret_with_department_region AS
      SELECT e.siret,
        pdr.department_name,
        pdr.region_name
      FROM establishments e
      LEFT JOIN ${joinTableName} el ON ((el.establishment_siret = e.siret))
      LEFT JOIN ${establishmentsLocationsTableName} loc ON ((loc.id = el.location_id))
      LEFT JOIN public_department_region pdr ON ((pdr.department_code = loc.department_code));
    `);
  }
};

const createEstablishmentsView = (
  pgm: MigrationBuilder,
  direction: "up" | "down",
) => {
  if (direction === "down") {
    pgm.sql(`
    CREATE MATERIALIZED VIEW view_establishments AS
    WITH count_conventions_by_siret AS (
      SELECT conventions.siret,
        count(*) AS count
        FROM conventions
      WHERE ((conventions.status)::text = 'ACCEPTED_BY_VALIDATOR'::text)
      GROUP BY conventions.siret
    ), count_contact_requests_by_siret AS (
      SELECT DISTINCT count(discussions.siret) AS count,
        discussions.siret
        FROM discussions
      GROUP BY discussions.siret
    )
      SELECT DISTINCT e.created_at AS "Date de référencement",
      e.update_date AS "Date de mise à jour",
      e.siret AS "Siret",
      e.name AS "Raison Sociale",
      e.customized_name AS "Enseigne",
      e.street_number_and_address AS "Adresse",
      e.post_code AS "Code Postal",
      e.city AS "Ville",
      sdr.department_name AS "Département",
      sdr.region_name AS "Région",
      e.naf_code AS "NAF",
      pnc.class_id AS "Id Classe NAF",
      pnc.class_label AS "Classe NAF",
      pnc.group_id AS "Id Groupe NAF",
      pnc.group_label AS "Groupe NAF",
      pnc.division_id AS "Id Division NAF",
      pnc.division_label AS "Division NAF",
      pnc.section_id AS "Id Section NAF",
      pnc.section_label AS "Section NAF",
      e.number_employees AS "Nombre d’employés",
      concat(ic.firstname, ic.lastname) AS "Contact",
      ic.job AS "Rôle du contact",
      ic.email AS "Email du contact",
      ic.phone AS "Téléphone du contact",
        CASE
            WHEN (ic.contact_mode = 'PHONE'::contact_mode) THEN 'Téléphone'::text
            WHEN (ic.contact_mode = 'IN_PERSON'::contact_mode) THEN 'En personne'::text
            ELSE 'Email'::text
        END AS "Mode de contact",
        CASE
            WHEN e.is_commited THEN 'Oui'::text
            ELSE 'Non déclaré'::text
        END AS "Appartenance Réseau « Les entreprises s’engagent »",
        CASE
            WHEN e.is_searchable THEN 'Oui'::text
            ELSE 'Non'::text
        END AS "Visible",
      e.source_provider AS "Origine",
      COALESCE(count_rel.count, (0)::bigint) AS "Nombre de mise en relation pour cette entreprise",
      COALESCE(count_conv.count, (0)::bigint) AS "Nombre de convention validée pour cette entreprise"
      FROM ((((((establishments e
      LEFT JOIN establishments__immersion_contacts eic ON ((eic.establishment_siret = e.siret)))
      LEFT JOIN immersion_contacts ic ON ((eic.contact_uuid = ic.uuid)))
      LEFT JOIN view_siret_with_department_region sdr ON ((sdr.siret = e.siret)))
      LEFT JOIN public_naf_classes_2008 pnc ON (((pnc.class_id)::text = regexp_replace((e.naf_code)::text, '(\d\d)(\d\d)(\w)'::text, '\\1.\\2'::text))))
      LEFT JOIN count_contact_requests_by_siret count_rel ON ((count_rel.siret = e.siret)))
      LEFT JOIN count_conventions_by_siret count_conv ON ((count_conv.siret = e.siret)));
    `);
  } else {
    pgm.sql(`
    CREATE MATERIALIZED VIEW view_establishments AS
    WITH count_conventions_by_siret AS (
      SELECT conventions.siret,
        count(*) AS count
        FROM conventions
      WHERE ((conventions.status)::text = 'ACCEPTED_BY_VALIDATOR'::text)
      GROUP BY conventions.siret
    ), count_contact_requests_by_siret AS (
      SELECT DISTINCT count(discussions.siret) AS count,
        discussions.siret
        FROM discussions
      GROUP BY discussions.siret
    )
      SELECT DISTINCT e.created_at AS "Date de référencement",
      e.update_date AS "Date de mise à jour",
      e.siret AS "Siret",
      e.name AS "Raison Sociale",
      e.customized_name AS "Enseigne",
      loc.street_number_and_address AS "Adresse",
      loc.post_code AS "Code Postal",
      loc.city AS "Ville",
      sdr.department_name AS "Département",
      sdr.region_name AS "Région",
      e.naf_code AS "NAF",
      pnc.class_id AS "Id Classe NAF",
      pnc.class_label AS "Classe NAF",
      pnc.group_id AS "Id Groupe NAF",
      pnc.group_label AS "Groupe NAF",
      pnc.division_id AS "Id Division NAF",
      pnc.division_label AS "Division NAF",
      pnc.section_id AS "Id Section NAF",
      pnc.section_label AS "Section NAF",
      e.number_employees AS "Nombre d’employés",
      concat(ic.firstname, ic.lastname) AS "Contact",
      ic.job AS "Rôle du contact",
      ic.email AS "Email du contact",
      ic.phone AS "Téléphone du contact",
        CASE
            WHEN (ic.contact_mode = 'PHONE'::contact_mode) THEN 'Téléphone'::text
            WHEN (ic.contact_mode = 'IN_PERSON'::contact_mode) THEN 'En personne'::text
            ELSE 'Email'::text
        END AS "Mode de contact",
        CASE
            WHEN e.is_commited THEN 'Oui'::text
            ELSE 'Non déclaré'::text
        END AS "Appartenance Réseau « Les entreprises s’engagent »",
        CASE
            WHEN e.is_searchable THEN 'Oui'::text
            ELSE 'Non'::text
        END AS "Visible",
      e.source_provider AS "Origine",
      COALESCE(count_rel.count, (0)::bigint) AS "Nombre de mise en relation pour cette entreprise",
      COALESCE(count_conv.count, (0)::bigint) AS "Nombre de convention validée pour cette entreprise"
      FROM ((((((establishments e
      LEFT JOIN establishments__immersion_contacts eic ON ((eic.establishment_siret = e.siret)))
      LEFT JOIN immersion_contacts ic ON ((eic.contact_uuid = ic.uuid)))
      LEFT JOIN view_siret_with_department_region sdr ON ((sdr.siret = e.siret)))
      LEFT JOIN public_naf_classes_2008 pnc ON (((pnc.class_id)::text = regexp_replace((e.naf_code)::text, '(\d\d)(\d\d)(\w)'::text, '\\1.\\2'::text))))
      LEFT JOIN count_contact_requests_by_siret count_rel ON ((count_rel.siret = e.siret)))
      LEFT JOIN count_conventions_by_siret count_conv ON ((count_conv.siret = e.siret))
      LEFT JOIN establishments__establishments_locations eel ON ((eel.establishment_siret = e.siret))
      LEFT JOIN establishments_locations loc ON ((loc.id = eel.location_id))
      )
      `);
  }
};

const createEstablishmentsWithAggredatedOffersView = (
  pgm: MigrationBuilder,
) => {
  pgm.sql(`
  CREATE MATERIALIZED VIEW view_establishments_with_aggregated_offers AS
  WITH offers_by_siret AS (
    SELECT e.siret,
       array_agg(pad.libelle_appellation_long) AS appelation_labels,
       array_agg(io_1.rome_code) AS rome_codes
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        LEFT JOIN public_appellations_data pad ON ((((pad.code_rome)::bpchar = io_1.rome_code) AND (pad.ogr_appellation = io_1.appellation_code))))
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
  `);
};

const createEstablishmentsWithFlattedOffersView = (pgm: MigrationBuilder) => {
  pgm.sql(`
  CREATE MATERIALIZED VIEW view_establishments_with_flatten_offers AS
  WITH offers_by_siret AS (
    SELECT e.siret,
       pad.libelle_appellation_long AS appelation_labels,
       io_1.rome_code
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        LEFT JOIN public_appellations_data pad ON ((((pad.code_rome)::bpchar = io_1.rome_code) AND (pad.ogr_appellation = io_1.appellation_code))))
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
LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));`);
};

const createOffersFromFormEstablishmentsView = (
  pgm: MigrationBuilder,
  direction: "up" | "down",
) => {
  if (direction === "down") {
    pgm.sql(`
  CREATE VIEW view_offers_from_form_establishment AS
  SELECT io.update_date,
    e.name,
    vad.rome_label,
    vad.appellation_label,
    io.siret,
    e.post_code
   FROM ((immersion_offers io
     LEFT JOIN establishments e ON ((io.siret = e.siret)))
     LEFT JOIN view_appellations_dto vad ON ((io.appellation_code = vad.appellation_code)))
  ORDER BY ROW(io.update_date, e.name);
  `);
  } else {
    pgm.sql(`
    CREATE VIEW view_offers_from_form_establishment AS
  SELECT io.update_date,
    e.name,
    vad.rome_label,
    vad.appellation_label,
    io.siret,
    loc.post_code
   FROM ((immersion_offers io
     LEFT JOIN establishments e ON ((io.siret = e.siret)))
     LEFT JOIN view_appellations_dto vad ON ((io.appellation_code = vad.appellation_code))
      LEFT JOIN establishments__establishments_locations eel ON ((eel.establishment_siret = e.siret))
      LEFT JOIN establishments_locations loc ON ((loc.id = eel.location_id))
     )
  ORDER BY ROW(io.update_date, e.name);`);
  }
};
