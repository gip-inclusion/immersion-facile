import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("discussions", {
    candidate_warned_method: {
      type: "text",
      notNull: false,
    },
  });

  pgm.addTypeValue("discussion_rejection_kind", "CANDIDATE_ALREADY_WARNED", {
    ifNotExists: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("discussions", "candidate_warned_method");
}
