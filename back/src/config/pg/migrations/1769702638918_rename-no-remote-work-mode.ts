import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "immersion_offers";
const columnName = "remote_work_mode";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = 'ON_SITE'
    WHERE ${columnName} = 'NO_REMOTE'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = 'NO_REMOTE'
    WHERE ${columnName} = 'ON_SITE'
  `);
}
