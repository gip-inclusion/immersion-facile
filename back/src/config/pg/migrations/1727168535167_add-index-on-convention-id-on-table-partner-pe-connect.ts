import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("partners_pe_connect", "convention_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("partners_pe_connect", "convention_id");
}
