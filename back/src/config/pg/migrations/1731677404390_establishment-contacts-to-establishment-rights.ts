import { MigrationBuilder } from "node-pg-migrate";

const establishmentTableName = "establishments";
const establishmentContactsTableName = "establishments_contacts";
const renamedEstablishmentContactsTableName = "__old_establishments_contacts";
const establishmentsUsersTableName = "establishments__users";
const contactModeColumnName = "contact_mode";

export async function up(pgm: MigrationBuilder): Promise<void> {
  A_copyContactModeInEstablishmentTable(pgm, "up");
  B_createMissingContactCopyEmailUsers(pgm);
  C_createMissingContactAdminUsers(pgm);
  D_updateExistingContactAdminUsersWithoutFirstNameAndLastName(pgm);
  E_createEstablishmentUserTable(pgm, "up");
  F_createCopyContactRights(pgm);
  G_createAdminContactRights(pgm);
  H_updateViewEstablishments(pgm, "up");
  I_renameEstablishmentContactTable(pgm, "up");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  I_renameEstablishmentContactTable(pgm, "down");
  H_updateViewEstablishments(pgm, "down");
  E_createEstablishmentUserTable(pgm, "down");
  A_copyContactModeInEstablishmentTable(pgm, "down");
}

const A_copyContactModeInEstablishmentTable = (
  pgm: MigrationBuilder,
  mode: "up" | "down",
) => {
  if (mode === "up") {
    pgm.addColumn(establishmentTableName, {
      [contactModeColumnName]: {
        type: "contact_mode",
        notNull: false,
      },
    });
    pgm.sql(`
      UPDATE ${establishmentTableName}
      SET ${contactModeColumnName} = ${establishmentContactsTableName}.${contactModeColumnName}
      FROM ${establishmentContactsTableName}
      WHERE ${establishmentTableName}.siret = ${establishmentContactsTableName}.siret;
    `);
    pgm.alterColumn(establishmentTableName, contactModeColumnName, {
      notNull: true,
    });
  }
  if (mode === "down") {
    pgm.dropColumn(establishmentTableName, contactModeColumnName);
  }
};

const B_createMissingContactCopyEmailUsers = (pgm: MigrationBuilder) => {
  pgm.sql(`
    INSERT INTO users 
      (id,email,first_name,last_name)
    SELECT gen_random_uuid() ,email , '', ''
    FROM (
      SELECT DISTINCT contact_emails.email
      FROM (
        SELECT DISTINCT jsonb_array_elements_text(copy_emails) AS email
        FROM establishments_contacts
      ) as contact_emails
      LEFT JOIN users ON contact_emails.email = users.email
      WHERE users.email IS NULL
    ) missing_contacts
  `);
};

const C_createMissingContactAdminUsers = (pgm: MigrationBuilder) => {
  pgm.sql(`
    INSERT INTO users 
      (id, email, first_name, last_name)
    SELECT 
      gen_random_uuid(), email, firstname, lastname
    FROM (
      SELECT DISTINCT contact_admins.email, contact_admins.firstname, contact_admins.lastname
      FROM (
        SELECT email, siret, firstname, lastname
        FROM establishments_contacts
      ) as contact_admins
      LEFT JOIN users ON contact_admins.email = users.email
      WHERE users.email IS NULL
    ) missing_admins
  `);
};

const D_updateExistingContactAdminUsersWithoutFirstNameAndLastName = (
  pgm: MigrationBuilder,
) => {
  pgm.sql(`
    UPDATE users
    SET 
      first_name = firstname,
      last_name = lastname
    FROM (
      SELECT contact_admins.email, contact_admins.firstname, contact_admins.lastname
      FROM (
        SELECT email, siret, firstname, lastname
        FROM establishments_contacts
      ) as contact_admins
      LEFT JOIN users ON contact_admins.email = users.email
      WHERE users.email IS NOT NULL
      AND users.first_name = ''
      AND users.last_name = ''
    ) admin_to_update
    WHERE users.email = admin_to_update.email
  `);
};

const E_createEstablishmentUserTable = (
  pgm: MigrationBuilder,
  mode: "up" | "down",
) => {
  if (mode === "up") {
    pgm.createTable(establishmentsUsersTableName, {
      siret: {
        type: "char(14)",
        notNull: true,
        references: { name: "establishments" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: "uuid",
        notNull: true,
        references: { name: "users" },
        onDelete: "CASCADE",
      },
      role: {
        type: "varchar(255)",
        notNull: true,
      },
      job: {
        type: "varchar(255)",
        notNull: false,
      },
      phone: {
        type: "varchar(255)",
        notNull: false,
      },
    });
    pgm.addConstraint(establishmentsUsersTableName, "unique_user_id_siret", {
      unique: ["user_id", "siret"],
    });
  }
  if (mode === "down") {
    pgm.dropTable(establishmentsUsersTableName);
  }
};

const F_createCopyContactRights = (pgm: MigrationBuilder) => {
  pgm.sql(`
    INSERT INTO ${establishmentsUsersTableName} 
      (siret, user_id, role)
    SELECT 
      siret, user_id, 'establishment_contact'
    FROM (
      SELECT contacts_with_siret.siret, users.id as user_id
      FROM (
        SELECT DISTINCT jsonb_array_elements_text(copy_emails) AS email, siret
        FROM establishments_contacts
      ) as contacts_with_siret
      JOIN users ON contacts_with_siret.email = users.email
    ) contact_users
  `);
};

const G_createAdminContactRights = (pgm: MigrationBuilder) => {
  pgm.sql(`
    INSERT INTO ${establishmentsUsersTableName} 
      (siret, user_id, job, phone, role)
    SELECT 
      siret, user_id, job, phone, 'establishment_admin'
    FROM (
      SELECT admins_with_siret.siret, users.id as user_id, admins_with_siret.job, admins_with_siret.phone
      FROM (
        SELECT email, siret, job, phone
        FROM establishments_contacts
      ) as admins_with_siret
      JOIN users ON admins_with_siret.email = users.email
    ) admin_users
  `);
};

const H_updateViewEstablishments = (
  pgm: MigrationBuilder,
  mode: "up" | "down",
) => {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");

  pgm.createMaterializedView(
    "view_establishments",
    {},
    `
    WITH 
      count_conventions_by_siret AS (
        SELECT conventions.siret, count(*) AS count
        FROM conventions
        WHERE ((conventions.status)::text = 'ACCEPTED_BY_VALIDATOR'::text)
        GROUP BY conventions.siret
      ),
      count_contact_requests_by_siret AS (
        SELECT DISTINCT count(discussions.siret) AS count,discussions.siret
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
      ${
        mode === "up"
          ? `-- concat(users.first_name, ' ' , users.last_name) AS "Contact",`
          : `concat(ec.firstname, ' ' , ec.lastname) AS "Contact",`
      }
      ${mode === "up" ? "-- eu" : "ec"}.job AS "Rôle du contact",
      ${mode === "up" ? "-- users" : "ec"}.email AS "Email du contact",
      ${mode === "up" ? "-- eu" : "ec"}.phone AS "Téléphone du contact",
      CASE
        WHEN (${mode === "up" ? "e" : "ec"}.contact_mode = 'PHONE'::contact_mode) THEN 'Téléphone'::text
        WHEN (${mode === "up" ? "e" : "ec"}.contact_mode = 'IN_PERSON'::contact_mode) THEN 'En personne'::text
        ELSE 'Email'::text
      END AS "Mode de contact",
      CASE
        WHEN e.is_commited THEN 'Oui'::text
        ELSE 'Non déclaré'::text
      END AS "Appartenance Réseau « Les entreprises s’engagent »",
      CASE
        WHEN e.fit_for_disabled_workers THEN 'Oui'::text
        ELSE 'Non'::text
      END AS "Accueil les personnes en situation de handicap",
      CASE
        WHEN e.is_searchable THEN 'Oui'::text
        ELSE 'Non'::text
      END AS "Visible",
      e.source_provider AS "Origine",
      COALESCE(count_rel.count, (0)::bigint) AS "Nombre de mise en relation pour cette entreprise",
      COALESCE(count_conv.count, (0)::bigint) AS "Nombre de convention validée pour cette entreprise"
    FROM 
    (
      (
        (
          (
            (
              (
                establishments e
                LEFT JOIN ${
                  mode === "up"
                    ? "establishments__users eu"
                    : "establishments_contacts ec"
                } ON ((e.siret = ${mode === "up" ? "eu" : "ec"}.siret))
                ${
                  mode === "up"
                    ? "-- LEFT JOIN users ON users.id = eu.user_id"
                    : ""
                }
              )
              LEFT JOIN view_siret_with_department_region sdr ON ((sdr.siret = e.siret))
            )
            LEFT JOIN public_naf_classes_2008 pnc ON (((pnc.class_id)::text = regexp_replace((e.naf_code)::text, '(\\d{2})(\\d{2}).*'::text, '\\1.\\2'::text)))
          )
          LEFT JOIN count_contact_requests_by_siret count_rel ON ((count_rel.siret = e.siret))
        )
        LEFT JOIN count_conventions_by_siret count_conv ON ((count_conv.siret = e.siret))
      )
      LEFT JOIN establishments_location_infos loc ON ((loc.establishment_siret = e.siret))
    )
    ;
  `,
  );
  pgm.createMaterializedView(
    "view_establishments_with_flatten_offers",
    {},
    `
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
    ${mode === "up" ? "" : 'view_establishments."Contact",'}
    ${mode === "up" ? "" : 'view_establishments."Rôle du contact",'}
    ${mode === "up" ? "" : 'view_establishments."Email du contact",'}
    ${mode === "up" ? "" : 'view_establishments."Téléphone du contact",'}
    view_establishments."Mode de contact",
    view_establishments."Appartenance Réseau « Les entreprises s’engagent »",
    view_establishments."Accueil les personnes en situation de handicap",
    view_establishments."Visible",
    view_establishments."Origine",
    view_establishments."Nombre de mise en relation pour cette entreprise",
    view_establishments."Nombre de convention validée pour cette entreprise",
    io.rome_code AS "Code Métier",
    io.appelation_labels AS "Métier"
    FROM (view_establishments
    LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
  `,
  );
  pgm.createMaterializedView(
    "view_establishments_with_aggregated_offers",
    {},
    `
    WITH offers_by_siret AS (
      SELECT 
        e.siret,
        array_agg(pad.libelle_appellation_long) AS appelation_labels,
        array_agg(io_1.rome_code) AS rome_codes
      FROM establishments e
      LEFT JOIN immersion_offers io_1 ON io_1.siret = e.siret
      LEFT JOIN public_appellations_data pad ON (pad.code_rome)::bpchar = io_1.rome_code AND pad.ogr_appellation = io_1.appellation_code
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
      ${mode === "up" ? "" : 'view_establishments."Contact",'}
      ${mode === "up" ? "" : 'view_establishments."Rôle du contact",'}
      ${mode === "up" ? "" : 'view_establishments."Email du contact",'}
      ${mode === "up" ? "" : 'view_establishments."Téléphone du contact",'}
      view_establishments."Mode de contact",
      view_establishments."Appartenance Réseau « Les entreprises s’engagent »",
      view_establishments."Accueil les personnes en situation de handicap",
      view_establishments."Visible",
      view_establishments."Origine",
      view_establishments."Nombre de mise en relation pour cette entreprise",
      view_establishments."Nombre de convention validée pour cette entreprise",
      io.rome_codes AS "Codes Métier",
      io.appelation_labels AS "Métiers"
    FROM view_establishments
    LEFT JOIN offers_by_siret io ON io.siret = view_establishments."Siret";
  `,
  );
};

const I_renameEstablishmentContactTable = (
  pgm: MigrationBuilder,
  mode: "up" | "down",
) => {
  pgm.renameTable(
    mode === "up"
      ? establishmentContactsTableName
      : renamedEstablishmentContactsTableName,
    mode === "up"
      ? renamedEstablishmentContactsTableName
      : establishmentContactsTableName,
  );
};
