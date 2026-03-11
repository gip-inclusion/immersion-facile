/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_assessments", "created_at", {
    default: null,
  });
  pgm.alterColumn("immersion_assessments", "created_at", {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_assessments", "created_at", {
    notNull: false,
  });
  pgm.alterColumn("immersion_assessments", "created_at", {
    default: pgm.func("now()"),
  });
}
