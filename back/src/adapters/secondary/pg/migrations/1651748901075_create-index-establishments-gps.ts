/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(
    `CREATE INDEX establishments_gps ON establishments USING GIST (geography(gps));`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("establishments", "", { name: "establishments_gps" });
}
