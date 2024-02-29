/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const timestampTz = (pgm: MigrationBuilder) => ({
  type: "timestamptz",
  notNull: true,
  default: pgm.func("now()"),
});

const tableName = "short_link_repository";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(tableName, {
    short_link_id: {
      type: "varchar(36)",
      notNull: true,
      primaryKey: true,
    },
    url: {
      type: "text",
      notNull: true,
    },
    created_at: timestampTz(pgm),
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(tableName);
}
