import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_contacts", {
    copy_emails: { type: "jsonb", default: "[]", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_contacts", "copy_emails");
}
