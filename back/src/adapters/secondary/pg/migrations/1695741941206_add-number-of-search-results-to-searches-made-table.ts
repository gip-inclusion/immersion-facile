import { MigrationBuilder } from "node-pg-migrate";

const tableName = "searches_made";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(tableName, {
    number_of_results: {
      type: "int",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, ["number_of_results"]);
}
