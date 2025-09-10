import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.db.query(`
    update discussions
    set potential_beneficiary_phone = '+33600000000'
    where potential_beneficiary_phone is null
  `);

  await pgm.db.query(`
    update discussions
    set potential_beneficiary_date_preferences = ''
    where potential_beneficiary_date_preferences is null
  `);

  pgm.alterColumn("discussions", "potential_beneficiary_phone", {
    type: "text",
    notNull: true,
  });

  pgm.alterColumn("discussions", "potential_beneficiary_date_preferences", {
    type: "text",
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("discussions", "potential_beneficiary_phone", {
    type: "text",
    notNull: false,
  });
  pgm.alterColumn("discussions", "potential_beneficiary_date_preferences", {
    type: "text",
    notNull: false,
  });
}
