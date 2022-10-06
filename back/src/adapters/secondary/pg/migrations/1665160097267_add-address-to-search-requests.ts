/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("searches_made", { address: "text" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("searches_made", "address");
}
