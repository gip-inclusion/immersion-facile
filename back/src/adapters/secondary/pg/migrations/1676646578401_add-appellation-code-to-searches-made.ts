import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("searches_made", {
    appellation_code: { type: "varchar(6)", notNull: false, default: null },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("searches_made", "appellation_code");
}
