import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM searches_made WHERE update_date <= '2023-11-30'`);
}

export async function down(): Promise<void> {
  //   nothing to do
}
