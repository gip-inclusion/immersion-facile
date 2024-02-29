import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_offers", "naf", { type: "char(5)" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_offers", "naf", { type: "char(255)" });
}
