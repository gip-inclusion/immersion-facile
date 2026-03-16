/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "establishments__users";
const columnName = "status";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("establishment_user_right_status", ["ACCEPTED", "PENDING"]);
  pgm.addColumn(tableName, {
    [columnName]: {
      type: "establishment_user_right_status",
      notNull: true,
      default: "PENDING",
    },
  });

  pgm.sql(`
    UPDATE ${tableName}
    SET ${columnName} = 'ACCEPTED'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, columnName);
}
