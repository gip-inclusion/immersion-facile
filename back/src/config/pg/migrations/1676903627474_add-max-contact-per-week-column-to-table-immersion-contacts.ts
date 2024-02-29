import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_contacts", {
    max_contact_per_week: { type: "int4", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_contacts", "max_contact_per_week");
}
