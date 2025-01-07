import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // remove " and \ from emails in discussions table
  pgm.sql(`
      UPDATE discussions
      SET establishment_contact_copy_emails = (
            SELECT jsonb_agg(REPLACE(value::text, '\\"', '')::jsonb)
             FROM jsonb_array_elements(establishment_contact_copy_emails) AS elems(value))
      WHERE EXISTS (
            SELECT 1
            FROM
                jsonb_array_elements(establishment_contact_copy_emails) AS elems(value)
            WHERE
                value::text LIKE '%\\"%');
  `);

  // get notifications id with troubles
  const result = await pgm.db.query(`
      select notifications_email_id
    from notifications_email_recipients
    where recipient_type = 'cc' and email ilike '"%'
  `);

  const formattedNotificationIds = result.rows
    .map(({ notifications_email_id }) => `'${notifications_email_id}'`)
    .join(",");

  // update notifications and free outbox event in quarantine
  if (formattedNotificationIds.length > 0) {
    await pgm.db.query(
      `
      UPDATE notifications_email_recipients
      SET email = REPLACE(email, '"', '')
      WHERE notifications_email_id in (${formattedNotificationIds})
      `,
    );

    await pgm.db.query(`
      update outbox
      set was_quarantined = false
      where was_quarantined = true 
        and occurred_at > '2024-08-06 12:00:00'
        and topic = 'NotificationAdded'
      `);
  }
}

export async function down(): Promise<void> {
  // nothing to do
}
