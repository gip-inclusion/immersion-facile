import { MigrationBuilder } from "node-pg-migrate";

const tableName = "establishments_deleted";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(tableName, {
    siret: {
      type: "character(14)",
      primaryKey: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
    },
    deleted_at: {
      type: "timestamptz",
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(tableName);
}
