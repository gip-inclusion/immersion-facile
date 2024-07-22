import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("conventions", "date_start");
  pgm.createIndex("conventions", "status");
  pgm.createIndex("conventions", "siret");
  pgm.createIndex("conventions", "agency_id");

  pgm.createIndex("exchanges", "discussion_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("conventions", "date_start");
  pgm.dropIndex("conventions", "status");
  pgm.dropIndex("conventions", "siret");
  pgm.dropIndex("conventions", "agency_id");

  pgm.dropIndex("exchanges", "discussion_id");
}
