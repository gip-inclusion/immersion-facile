import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishment_lead_events", "convention_id", {
    notNull: false,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishment_lead_events", "convention_id", {
    notNull: true,
  });
}
