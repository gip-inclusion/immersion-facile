/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("discussions", {
    kind: { type: "varchar(255)", default: "IF" },
    potential_beneficiary_level_of_education: {
      type: "varchar(255)",
      notNull: false,
    },
  });

  pgm.alterColumn("discussions", "kind", {
    type: "varchar(255)",
    notNull: true,
    default: null,
  });

  await pgm.db.query(`
    UPDATE discussions
    SET potential_beneficiary_date_preferences = 'non communiqué'
    WHERE potential_beneficiary_date_preferences IS NULL
    AND contact_method = 'EMAIL'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("discussions", "kind");
  pgm.dropColumn("discussions", "potential_beneficiary_level_of_education");
}
