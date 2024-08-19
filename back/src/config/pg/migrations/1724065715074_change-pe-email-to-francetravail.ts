import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    "users_ongoing_oauths",
    "ongoing_oauths_refers_to_authenticated_users_id_fkey",
  );
  pgm.addConstraint(
    "users_ongoing_oauths",
    "ongoing_oauths_refers_to_authenticated_users_id_fkey",
    {
      foreignKeys: {
        columns: "user_id",
        references: "users(id)",
        onDelete: "CASCADE",
      },
    },
  );
  // Delete conflicting emails in the 'users' table
  pgm.sql(`
    DELETE FROM users
    WHERE email LIKE '%@pole-emploi%'
    AND EXISTS (
      SELECT 1 FROM users u2 
      WHERE u2.email = REPLACE(users.email, '@pole-emploi', '@francetravail')
    );
  `);

  // Update emails in the 'users' table
  pgm.sql(`
    UPDATE users
    SET email = REPLACE(email, '@pole-emploi', '@francetravail')
    WHERE email LIKE '%@pole-emploi%';
  `);

  // Update emails in the 'partners_pe_connect' table
  pgm.sql(`
    UPDATE partners_pe_connect
    SET email = REPLACE(email, '@pole-emploi', '@francetravail')
    WHERE email LIKE '%@pole-emploi%';
  `);

  // Update emails in the 'delegation_contacts' table
  pgm.sql(`
    UPDATE delegation_contacts
    SET email = REPLACE(email, '@pole-emploi', '@francetravail')
    WHERE email LIKE '%@pole-emploi%';
  `);

  // Update emails in the 'agency_groups' table
  pgm.sql(`
    UPDATE agency_groups
    SET email = REPLACE(email, '@pole-emploi', '@francetravail')
    WHERE email LIKE '%@pole-emploi%';
  `);

  // Update cc_emails in the 'agency_groups'
  pgm.sql(`
    WITH updated_emails AS (
      SELECT
        id,
        jsonb_agg(REPLACE(value, '@pole-emploi', '@francetravail')) AS new_cc_emails
      FROM
        agency_groups,
        jsonb_array_elements_text(cc_emails) AS value
      GROUP BY
        id
    )
    UPDATE agency_groups
    SET cc_emails = updated_emails.new_cc_emails
    FROM updated_emails
    WHERE agency_groups.id = updated_emails.id
      AND cc_emails::text LIKE '%@pole-emploi%';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    "users_ongoing_oauths",
    "ongoing_oauths_refers_to_authenticated_users_id_fkey",
  );
  pgm.addConstraint(
    "users_ongoing_oauths",
    "ongoing_oauths_refers_to_authenticated_users_id_fkey",
    {
      foreignKeys: {
        columns: "user_id",
        references: "users(id)",
      },
    },
  );
}
