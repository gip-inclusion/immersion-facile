/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create the "banned_establishments" table
  pgm.createTable("banned_establishments", {
    siret: {
      type: "char(14)",
      primaryKey: true,
      unique: true,
    },
    bannishment_justification: {
      type: "text",
      notNull: true,
    },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop the "banned_establishments" table
  pgm.dropTable("banned_establishments");
}
