import { MigrationBuilder } from "node-pg-migrate";

const tableName = "saved_errors";
const columnName = "subscriber_error_feedback";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = ${columnName} - 'response'  || jsonb_build_object('error', ${columnName} -> 'response')
    WHERE ${columnName} ? 'response'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = ${columnName} - 'error'  || jsonb_build_object('response', ${columnName} -> 'error')
    WHERE ${columnName} ? 'error'
  `);
}
