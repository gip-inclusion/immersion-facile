import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // insert unique phone numbers from actors
  pgm.sql(`
      INSERT INTO phone_numbers (phone_number, created_at)
      SELECT DISTINCT actors.extra_fields ->> 'emergencyContactPhone' AS emergency_contact_phone, NOW()
      FROM actors
      WHERE actors.extra_fields ->> 'emergencyContactPhone' IS NOT NULL 
        AND actors.extra_fields ->> 'emergencyContactPhone' != ''
        AND NOT EXISTS (
          SELECT 1 FROM phone_numbers 
          WHERE phone_number = actors.extra_fields ->> 'emergencyContactPhone'
        );
    `);

  // add column to actors table
  pgm.addColumn("actors", {
    emergency_contact_phone_id: {
      type: "integer",
      references: "phone_numbers(id)",
      notNull: false,
    },
  });

  // update foreign keys in actors
  pgm.sql(`
      UPDATE actors
      SET emergency_contact_phone_id = phone_numbers.id
      FROM phone_numbers
      WHERE actors.extra_fields ->> 'emergencyContactPhone' IS NOT NULL
        AND actors.extra_fields ->> 'emergencyContactPhone' != ''
        AND actors.extra_fields ->> 'emergencyContactPhone' = phone_numbers.phone_number;
        `);

  // remove emergency contact phone from extra_fields
  pgm.sql(`
      UPDATE actors
      SET extra_fields = extra_fields - 'emergencyContactPhone'
      WHERE extra_fields ->> 'emergencyContactPhone' IS NOT NULL
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE actors
    SET extra_fields = extra_fields || jsonb_build_object(
      'emergencyContactPhone', phone_numbers.phone_number
    )
    FROM phone_numbers
    WHERE actors.emergency_contact_phone_id = phone_numbers.id;
  `);

  pgm.dropColumn("actors", "emergency_contact_phone_id");
}
