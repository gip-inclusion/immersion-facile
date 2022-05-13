import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("sorted_by", ["distance", "date"]);
  pgm.addColumn("searches_made", {
    sorted_by: { type: "sorted_by", notNull: true, default: "distance" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("searches_made", "sorted_by");
  pgm.dropType("sorted_by");
}
