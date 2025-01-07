import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addTypeValue("sorted_by", "score");
}

export async function down(_: MigrationBuilder): Promise<void> {
  // No down migration : require
  //  - remove type reference on other tables by alter columns
  //  - drop type
  //  - recreate type without unecessary value
  //  - reapply type on other tables by alter columns
}
