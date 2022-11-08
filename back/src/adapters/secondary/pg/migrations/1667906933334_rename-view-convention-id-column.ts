import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('ALTER VIEW view_conventions RENAME COLUMN "id convention" TO id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('ALTER VIEW view_conventions RENAME COLUMN id TO "id convention"');
}
