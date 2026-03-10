import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("searches_made", "gps", { name: "searches_made_gps_index" });
  pgm.dropIndex("searches_made", "number_of_results", {
    name: "searches_made_number_of_results_index",
  });
}

// ne pas recréer ces index : ils ne sont jamais utilisés et pénalisent les INSERTs
export async function down(): Promise<void> {}
