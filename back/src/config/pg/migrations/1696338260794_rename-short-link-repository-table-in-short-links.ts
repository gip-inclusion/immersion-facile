import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("short_link_repository", "short_links");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("short_links", "short_link_repository");
}
