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

  pgm.alterColumn("phone_numbers", "verified_at", {
    type: "TIMESTAMPTZ",
    using: "verified_at AT TIME ZONE 'UTC'",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("phone_numbers", "verified_at", {
    type: "TIMESTAMP WITHOUT TIME ZONE",
    using: "verified_at AT TIME ZONE 'UTC'",
  });

  pgm.dropColumns("phone_numbers", ["verification_status"]);
  pgm.dropType(PHONE_VERIFICATION_STATUS_NAME);
}
