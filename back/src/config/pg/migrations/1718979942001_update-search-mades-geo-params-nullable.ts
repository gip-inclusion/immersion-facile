/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "searches_made";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(tableName, "lat", { notNull: false });
  pgm.alterColumn(tableName, "lon", { notNull: false });
  pgm.alterColumn(tableName, "distance", { notNull: false });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(tableName, "lat", { notNull: true });
  pgm.alterColumn(tableName, "lon", { notNull: true });
  pgm.alterColumn(tableName, "distance", { notNull: true });
}
