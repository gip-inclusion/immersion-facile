import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("establishments", {
    is_searchable: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
  pgm.addColumn("form_establishments", {
    is_searchable: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("establishments", "is_searchable");
  pgm.dropColumn("form_establishments", "is_searchable");
}
