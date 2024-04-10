import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishments", "additional_information", {
    notNull: false,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishments", "additional_information", {
    notNull: true,
  });
}
