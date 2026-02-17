import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex(
    "broadcast_feedbacks",
    "((request_params ->> 'conventionId')::uuid)",
    {
      name: "idx_broadcast_feedbacks_convention_id",
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(
    "broadcast_feedbacks",
    "((request_params ->> 'conventionId')::uuid)",
    {
      name: "idx_broadcast_feedbacks_convention_id",
    },
  );
}
