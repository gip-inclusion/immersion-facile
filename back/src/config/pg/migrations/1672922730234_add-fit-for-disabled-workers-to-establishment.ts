import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("form_establishments", {
    fit_for_disabled_workers: { type: "bool", default: false },
  });
  pgm.addColumn("establishments", {
    fit_for_disabled_workers: { type: "bool", default: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("form_establishments", "fit_for_disabled_workers");
  pgm.dropColumn("establishments", "fit_for_disabled_workers");
}
