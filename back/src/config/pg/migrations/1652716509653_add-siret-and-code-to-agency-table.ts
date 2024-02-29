import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("agencies", {
    agency_siret: { type: "char(14)", notNull: false },
    code: { type: "text", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("agencies", ["agency_siret", "code"]);
}
