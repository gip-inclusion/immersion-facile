import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DELETE FROM establishment_lead_events");
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
