import type { MigrationBuilder } from "node-pg-migrate";

const tableName = "searches_made";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(tableName, {
    fit_for_disabled_workers: { type: "jsonb", default: null },
    location_ids: { type: "jsonb", default: null },
    remote_work_modes: { type: "jsonb", default: null },
    show_only_available_offers: { type: "boolean", default: null },
    sirets: { type: "jsonb", default: null },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, {
    fit_for_disabled_workers: { type: "jsonb", default: null },
    location_ids: { type: "jsonb", default: null },
    remote_work_modes: { type: "jsonb", default: null },
    show_only_available_offers: { type: "boolean", default: null },
    sirets: { type: "jsonb", default: null },
  });
}
