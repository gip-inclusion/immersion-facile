import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("immersion_assessments", {
    convention_id: {
      type: "uuid",
      primaryKey: true,
      references: "immersion_applications",
      notNull: true,
    },
    status: { type: "text", notNull: true },
    establishment_feedback: { type: "text", notNull: true },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
    updated_at: { type: "timestamptz", default: pgm.func("now()") },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("immersion_assessments");
}
