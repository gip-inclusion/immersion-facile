/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_assessments", {
    beneficiary_agreement: { type: "boolean", notNull: false },
    beneficiary_feedback: { type: "varchar(1000)", notNull: false },
    signed_at: { type: "timestamptz", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_assessments", [
    "beneficiary_agreement",
    "beneficiary_feedback",
    "signed_at",
  ]);
}
