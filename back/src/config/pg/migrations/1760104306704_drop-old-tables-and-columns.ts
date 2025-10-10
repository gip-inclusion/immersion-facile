/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("__old_establishments_contacts", { ifExists: true });
  pgm.dropTable("__to_delete__discussion_contacts", { ifExists: true });
  pgm.dropTable("__to_delete__form_establishments", { ifExists: true });
  pgm.dropColumn(
    "discussions",
    "deprecated_potential_beneficiary_has_working_experience",
  );
}

export async function down(): Promise<void> {}
