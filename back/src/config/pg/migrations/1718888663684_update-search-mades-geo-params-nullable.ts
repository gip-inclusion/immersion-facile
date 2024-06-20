/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("search_mades", "lat", { notNull: false });
  pgm.alterColumn("search_mades", "lon", { notNull: false });
  pgm.alterColumn("search_mades", "distance_km", { notNull: false });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("search_mades", "lat", { notNull: true });
  pgm.alterColumn("search_mades", "lon", { notNull: true });
  pgm.alterColumn("search_mades", "distance_km", { notNull: true });
}
