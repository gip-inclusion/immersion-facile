import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("form_establishments", {
    source: {
      type: "varchar(255)",
      notNull: true,
      default: "immersion-facile",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("form_establishments", "source");
}
