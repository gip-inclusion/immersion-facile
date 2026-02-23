import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("actors", "phone_id");
  pgm.createIndex("discussions", "potential_beneficiary_phone_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("discussions", "potential_beneficiary_phone_id");
  pgm.dropIndex("actors", "phone_id");
}
