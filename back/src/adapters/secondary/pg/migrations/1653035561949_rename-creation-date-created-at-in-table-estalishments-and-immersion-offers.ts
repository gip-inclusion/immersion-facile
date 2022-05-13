/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("establishments", "creation_date", "created_at");
  pgm.renameColumn("immersion_offers", "creation_date", "created_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("establishments", "created_at", "creation_date");
  pgm.renameColumn("immersion_offers", "created_at", "creation_date");
}
