/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const columnName = "beneficiary_current_employer_id";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("conventions", {
    [columnName]: {
      type: "int",
      references: "actors",
      onDelete: "CASCADE",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("conventions", columnName);
}
