import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("discussions", {
    potential_beneficiary_phone: {
      type: "text",
      notNull: false,
      default: null,
    },
    immerssion_objective: { type: "text", notNull: false, default: null },
    potential_beneficiary_cv_link_or_linkedin: {
      type: "text",
      notNull: false,
      default: null,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("discussions", [
    "potential_beneficiary_phone",
    "immerssion_objective",
    "potential_beneficiary_cv_link_or_linkedin",
  ]);
}
