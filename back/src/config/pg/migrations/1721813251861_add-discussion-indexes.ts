import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("discussions", "siret");
  pgm.createIndex("discussions", "created_at");
  pgm.createIndex("exchanges", "sent_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("discussions", "siret");
  pgm.dropIndex("discussions", "created_at");
  pgm.dropIndex("exchanges", "sent_at");
}
