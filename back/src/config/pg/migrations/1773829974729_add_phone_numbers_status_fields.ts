import type { MigrationBuilder } from "node-pg-migrate";

const PHONE_VERIFICATION_STATUS_NAME = "phone_verification_status";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(PHONE_VERIFICATION_STATUS_NAME, [
    "NOT_VERIFIED",
    "PENDING_VERIFICATION",
    "VERIFICATION_COMPLETED",
  ]);

  pgm.addColumns("phone_numbers", {
    verification_status: {
      type: PHONE_VERIFICATION_STATUS_NAME,
      default: "NOT_VERIFIED",
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("phone_numbers", ["verification_status"]);
  pgm.dropType(PHONE_VERIFICATION_STATUS_NAME);
}
