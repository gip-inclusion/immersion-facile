/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "saved_errors";
const columnName = "subscriber_error_feedback";

const oldProperty = "response";
const newProperty = "error";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = ${columnName} - '${oldProperty}'  || jsonb_build_object('${newProperty}', ${columnName} -> '${oldProperty}')
    WHERE ${columnName} ? '${oldProperty}'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = ${columnName} - '${newProperty}'  || jsonb_build_object('${oldProperty}', ${columnName} -> '${newProperty}')
    WHERE ${columnName} ? '${newProperty}'
  `);
}
