/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const discussionsTableName = "discussions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex(discussionsTableName, "id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(discussionsTableName, "id");
}
