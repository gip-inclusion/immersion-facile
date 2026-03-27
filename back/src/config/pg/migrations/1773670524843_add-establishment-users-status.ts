/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "establishments__users";
const columnName = "status";
const ESTABLISHMENT_USER_RIGHT_STATUS_NAME = "establishment_user_right_status";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(ESTABLISHMENT_USER_RIGHT_STATUS_NAME, ["ACCEPTED", "PENDING"]);
  pgm.addColumn(tableName, {
    [columnName]: {
      type: ESTABLISHMENT_USER_RIGHT_STATUS_NAME,
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
  pgm.dropType(ESTABLISHMENT_USER_RIGHT_STATUS_NAME);
}
