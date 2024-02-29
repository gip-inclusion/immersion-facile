/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("searches_made", "sorted_by", { notNull: false });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("searches_made", "sorted_by", { notNull: true });
}
