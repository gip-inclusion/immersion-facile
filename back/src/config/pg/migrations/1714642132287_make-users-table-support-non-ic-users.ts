import { MigrationBuilder } from "node-pg-migrate";

const usersTable = "users";
const usersAgenciesTable = "users__agencies";
const agenciesTable = "agencies";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(usersTable, "external_id", { type: "text", notNull: false });

  pgm.addColumn(usersAgenciesTable, {
    is_notified_by_email: { type: "boolean", notNull: true, default: false },
  });

  // add all users from agencies if they don't exist already
  pgm.sql(`
    WITH emails_to_insert as (
      SELECT DISTINCT jsonb_array_elements_text(emails) AS email
      FROM (
         SELECT validator_emails AS emails FROM agencies
         UNION ALL
         SELECT counsellor_emails FROM agencies
      ) AS combined_emails
    )
    INSERT INTO users (id, email, first_name, last_name, external_id)
    SELECT uuid_generate_v4(), emails_to_insert.email, '', '', null
    FROM emails_to_insert
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE email ilike emails_to_insert.email
    );
  `);

  // add user rights if missing
  // for validators
  pgm.sql(`
  WITH users_agencies_to_add as (
    WITH emails_agencies as (
        SELECT DISTINCT jsonb_array_elements_text(a.validator_emails) as email, a.id as agency_id
        from agencies a
        )
    select u.id as user_id, emails_agencies.agency_id
    from emails_agencies
    join users u on emails_agencies.email ilike u.email
  )
  INSERT INTO users__agencies (user_id, agency_id, role, is_notified_by_email)
  SELECT uata.user_id, uata.agency_id, 'validator', true
  from users_agencies_to_add uata
  ON CONFLICT (user_id, agency_id)
      DO UPDATE SET is_notified_by_email = true;
  `);

  // for counsellors
  pgm.sql(`
  WITH users_agencies_to_add as (
    WITH emails_agencies as (
        SELECT DISTINCT jsonb_array_elements_text(a.counsellor_emails) as email, a.id as agency_id
        from agencies a
        )
    select u.id as user_id, emails_agencies.agency_id
    from emails_agencies
    join users u on emails_agencies.email ilike u.email
  )
  INSERT INTO users__agencies (user_id, agency_id, role, is_notified_by_email)
  SELECT uata.user_id, uata.agency_id, 'counsellor', true
  from users_agencies_to_add uata
  ON CONFLICT (user_id, agency_id)
      DO UPDATE SET is_notified_by_email = true;
  `);

  pgm.alterColumn(usersAgenciesTable, "is_notified_by_email", {
    type: "boolean",
    notNull: true,
    default: null,
  });

  // backup agency fields
  pgm.renameColumn(
    agenciesTable,
    "validator_emails",
    "validator_emails_backup",
  );
  pgm.alterColumn(agenciesTable, "validator_emails_backup", {
    default: "[]",
  });
  pgm.renameColumn(
    agenciesTable,
    "counsellor_emails",
    "counsellor_emails_backup",
  );
  pgm.alterColumn(agenciesTable, "counsellor_emails_backup", {
    default: "[]",
  });
  // drop unused agency fields
  pgm.dropColumn(agenciesTable, "admin_emails");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DELETE FROM users WHERE users.external_id IS NULL;");
  pgm.alterColumn(usersTable, "external_id", { type: "text", notNull: true });

  pgm.renameColumn(
    agenciesTable,
    "validator_emails_backup",
    "validator_emails",
  );
  pgm.renameColumn(
    agenciesTable,
    "counsellor_emails_backup",
    "counsellor_emails",
  );
  pgm.addColumn(agenciesTable, {
    admin_emails: { type: "jsonb", notNull: true, default: "[]" },
  });
  pgm.dropColumn(usersAgenciesTable, "is_notified_by_email");
}
