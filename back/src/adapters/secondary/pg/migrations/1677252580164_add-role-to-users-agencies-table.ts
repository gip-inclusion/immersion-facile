import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("agency_role", [
    "counsellor",
    "validator",
    "agencyOwner",
    "toReview",
  ]);
  pgm.addColumn("users__agencies", {
    role: {
      type: "agency_role",
      notNull: true,
      default: "toReview",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("users__agencies", "role");
  pgm.dropType("agency_role");
}
