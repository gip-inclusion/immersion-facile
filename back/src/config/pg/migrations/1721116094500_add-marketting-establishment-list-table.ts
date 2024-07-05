/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("marketing_establishment_contacts", {
    siret: { type: "char(14)", primaryKey: true },
    email: { type: "text", notNull: true },
    contact_history: { type: "jsonb", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("marketing_establishment_contacts");
}
