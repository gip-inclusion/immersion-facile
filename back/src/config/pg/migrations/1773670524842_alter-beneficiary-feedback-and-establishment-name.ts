import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_assessments", "beneficiary_feedback", {
    type: "varchar(3000)",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_assessments", "beneficiary_feedback", {
    type: "varchar(1000)",
  });
}
