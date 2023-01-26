import { MigrationBuilder } from "node-pg-migrate";
const table = "conventions";
const column = "business_advantages";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(table, {
    [column]: { type: "text" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(table, column);
}
