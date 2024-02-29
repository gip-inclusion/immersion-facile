/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("establishments", "is_active", "is_open");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("establishments", "is_open", "is_active");
}
