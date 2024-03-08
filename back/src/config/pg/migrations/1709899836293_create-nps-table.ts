import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("nps", {
    id: { type: "serial", primaryKey: true },
    convention_id: { type: "text" },
    role: { type: "text" },
    score: { type: "integer" },
    would_have_done_without_if: { type: "boolean" },
    comments: { type: "text" },
    raw_result: { type: "jsonb", notNull: true },
    respondent_id: { type: "text", notNull: true },
    response_id: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("nps");
}
