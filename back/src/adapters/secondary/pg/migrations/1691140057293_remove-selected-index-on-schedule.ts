/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

const conventionTableName = "conventions";
const scheduleColumnName = "schedule";
const selectedIndexAttributeName = "selectedIndex";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${conventionTableName}
    SET ${scheduleColumnName} = ${scheduleColumnName}::jsonb - '${selectedIndexAttributeName}'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${conventionTableName}
    SET ${scheduleColumnName} = jsonb_set(${scheduleColumnName}::jsonb,'{${selectedIndexAttributeName}}','0')
  `);
}
