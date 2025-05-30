import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users_ongoing_oauths", {
    email: {
      type: "text",
      notNull: false,
    },
    used_at: {
      type: "timestamptz",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("users_ongoing_oauths", ["email", "used_at"]);
}
