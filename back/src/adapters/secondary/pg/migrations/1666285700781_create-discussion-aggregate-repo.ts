import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("discussions", {
    id: { type: "uuid", unique: true, primaryKey: true, notNull: true },
    siret: { type: "char(14)", primaryKey: true, notNull: true },
    rome_code: { type: "char(5)", notNull: true },
    contact_mode: { type: "text", notNull: true },
    potential_beneficiary_first_name: { type: "text", notNull: true },
    potential_beneficiary_last_name: { type: "text", notNull: true },
    potential_beneficiary_email: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
  });

  pgm.createType("exchange_role", ["establishment", "potentialBeneficiary"]);

  pgm.createTable("exchanges", {
    discussion_id: { type: "uuid", notNull: true },
    message: { type: "text", notNull: true },
    sender: { type: "exchange_role", notNull: true },
    recipient: { type: "exchange_role", notNull: true },
    sent_at: { type: "timestamptz", notNull: true },
  });

  pgm.addConstraint("discussions", "fk_siret", {
    foreignKeys: {
      columns: "siret",
      references: "establishments(siret)",
    },
  });

  pgm.addConstraint("discussions", "fk_rome_code", {
    foreignKeys: {
      columns: "rome_code",
      references: "public_romes_data(code_rome)",
    },
  });

  pgm.addConstraint("exchanges", "fk_discussion_id", {
    foreignKeys: {
      columns: "discussion_id",
      references: "discussions(id)",
      onDelete: "CASCADE", // If a discussion is deleted, will delete the rows referencing the discussion_id
    },
  });

  // Migrate content from outbox to discussions and exchanges
  pgm.sql(`
  WITH outbox_info AS 
    (SELECT 
    occurred_at,
    payload ->> 'siret' AS siret, 
    payload -> 'offer' ->> 'romeCode' AS rome_code, 
    payload ->> 'potentialBeneficiaryFirstName' AS potential_beneficiary_first_name, 
    payload ->> 'potentialBeneficiaryLastName' AS potential_beneficiary_last_name, 
    payload ->> 'potentialBeneficiaryEmail' AS potential_beneficiary_email,
    payload ->> 'contactMode' AS contact_mode
  FROM outbox 
  WHERE topic = 'ContactRequestedByBeneficiary'
  AND payload ->> 'siret' IS NOT NULL
  )
  INSERT INTO discussions (id, siret, rome_code, contact_mode, potential_beneficiary_first_name, 
  potential_beneficiary_last_name, potential_beneficiary_email, created_at)
  SELECT gen_random_uuid(), outbox_info.siret, rome_code, contact_mode, potential_beneficiary_first_name, 
  potential_beneficiary_last_name, potential_beneficiary_email, occurred_at
  FROM outbox_info LEFT JOIN establishments e on e.siret = outbox_info.siret WHERE e.siret IS NOT NULL
`);

  pgm.sql(`
  WITH outbox_info AS  
  (SELECT 
      occurred_at,
      payload ->> 'siret' as siret, 
      payload -> 'offer' ->> 'romeCode' as rome_code, 
      payload ->> 'potentialBeneficiaryEmail' as potential_beneficiary_email,
      payload ->> 'message' as message
    FROM outbox 
    WHERE topic = 'ContactRequestedByBeneficiary'
    AND payload ->> 'siret' IS NOT NULL
)
  INSERT INTO exchanges(discussion_id, message, sent_at, sender, recipient) 
  SELECT id, message, created_at, 'potentialBeneficiary', 'establishment'
  FROM discussions AS d
  LEFT JOIN outbox_info AS o
  ON o.siret = d.siret AND o.rome_code = d.rome_code AND o.potential_beneficiary_email = d.potential_beneficiary_email 
  AND o.occurred_at = d.created_at 
  WHERE contact_mode = 'EMAIL'
`);

  // Migrate views
  await migrateViews(pgm);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await revertViews(pgm);
  pgm.dropTable("exchanges");
  pgm.dropTable("discussions");
  pgm.dropType("exchange_role");
}

const migrateViews = async (pgm: MigrationBuilder) => {
  await dropEstablishmentViews(pgm);
  await pgm.dropMaterializedView("view_contact_requests");
  await pgm.createMaterializedView(
    "view_contact_requests",
    {},
    new_SQL_view_contact_requests,
  );
  await recreateEstablishmentViews(pgm);
};

const revertViews = async (pgm: MigrationBuilder) => {
  await dropEstablishmentViews(pgm);
  await pgm.dropMaterializedView("view_contact_requests");
  await pgm.createMaterializedView(
    "view_contact_requests",
    {},
    old_SQL_view_contact_requests,
  );
  await recreateEstablishmentViews(pgm);
};

const dropEstablishmentViews = async (pgm: MigrationBuilder): Promise<void> => {
  pgm.dropMaterializedView("view_establishments_with_aggregated_offers");
  pgm.dropMaterializedView("view_establishments_with_flatten_offers");
  pgm.dropMaterializedView("view_establishments");
};

const old_SQL_view_contact_requests = `
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

const new_SQL_view_contact_requests = `
SELECT created_at AS "Date de la mise en relation",
       contact_mode AS "Type de mise en relation",
       potential_beneficiary_email AS "Email",
       discussions.siret AS "Siret",
       rome_code AS "Code métier",
       libelle_rome AS "Métier",
       e.department_name AS "Département", 
       e.region_name AS "Région"
FROM discussions
LEFT JOIN public_romes_data prd ON prd.code_rome = discussions.rome_code
LEFT JOIN view_siret_with_department_region e ON e.siret = discussions.siret`;

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
