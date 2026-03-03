import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("stats__most_frequent_searches", {
    avg_number_of_results: { type: "numeric", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("stats__most_frequent_searches", "avg_number_of_results");
}
