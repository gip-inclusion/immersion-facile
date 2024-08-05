import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("conventions", ["updated_at"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("conventions", ["updated_at"]);
}
