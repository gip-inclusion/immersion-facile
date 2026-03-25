import type { MigrationBuilder } from "node-pg-migrate";

const PHONE_STATUS_TYPE = "phone_status";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType(PHONE_STATUS_TYPE, [
    "NOT_VERIFIED",
    "UPDATE_PENDING",
    "VALID",
  ]);

  pgm.addColumns("phone_numbers", {
    status: {
      type: PHONE_STATUS_TYPE,
      default: "NOT_VERIFIED",
      notNull: true,
    },
  });

  pgm.alterColumn("phone_numbers", "verified_at", {
    type: "timestamptz",
  });
  pgm.alterColumn("phone_numbers", "created_at", {
    type: "timestamptz",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("phone_numbers", "verified_at", {
    type: "timestamp",
  });
  pgm.alterColumn("phone_numbers", "created_at", {
    type: "timestamp",
  });

  pgm.dropColumns("phone_numbers", ["status"]);
  pgm.dropType(PHONE_STATUS_TYPE);
}
