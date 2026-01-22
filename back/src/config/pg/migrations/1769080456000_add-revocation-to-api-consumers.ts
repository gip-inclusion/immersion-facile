import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "api_consumers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    revoked_at: {
      type: "timestamptz",
      notNull: false,
    },
    current_key_issued_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.alterColumn(tableName, "current_key_issued_at", {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, "revoked_at");
  pgm.dropColumn(tableName, "current_key_issued_at");
}
