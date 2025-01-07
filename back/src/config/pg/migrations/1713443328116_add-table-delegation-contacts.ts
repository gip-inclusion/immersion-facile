import { MigrationBuilder } from "node-pg-migrate";

const tableName = "delegation_contacts";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(tableName, {
    province: { type: "varchar(255)", primaryKey: true },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
    updated_at: { type: "timestamptz", default: pgm.func("now()") },
    email: { type: "varchar(255)", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(tableName);
}
