import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("establishments_locations", "position", { method: "gist" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("establishments_locations", "position");
}
