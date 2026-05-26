import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.noTransaction();

  pgm.addColumn("broadcast_feedbacks", {
    convention_id: { type: "uuid", notNull: false },
    agency_id: { type: "uuid", notNull: false },
  });

  // Overlaps with idx_broadcast_feedbacks_convention_id (expression index on
  // request_params->>'conventionId') from migration 1771275715629 during the
  // expand window; the old expression index is dropped in step 2 (#4896).
  pgm.createIndex("broadcast_feedbacks", "convention_id", {
    name: "idx_bf_convention_id",
    concurrently: true,
  });

  pgm.createIndex(
    "broadcast_feedbacks",
    ["agency_id", { name: "occurred_at", sort: "DESC" }],
    { name: "idx_bf_agency_id_occurred_at", concurrently: true },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.noTransaction();

  pgm.dropIndex("broadcast_feedbacks", ["agency_id", "occurred_at"], {
    name: "idx_bf_agency_id_occurred_at",
    concurrently: true,
  });
  pgm.dropIndex("broadcast_feedbacks", "convention_id", {
    name: "idx_bf_convention_id",
    concurrently: true,
  });
  pgm.dropColumn("broadcast_feedbacks", "agency_id");
  pgm.dropColumn("broadcast_feedbacks", "convention_id");
}
