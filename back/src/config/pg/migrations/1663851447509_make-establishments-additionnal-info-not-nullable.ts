import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE establishments SET additional_information='' WHERE additional_information IS NULL;`,
  );
  pgm.alterColumn("establishments", "additional_information", {
    notNull: true,
    default: "",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("establishments", "additional_information", {
    notNull: false,
    default: null,
  });
}
