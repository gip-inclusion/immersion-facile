/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const discussionsTable = "discussions";
const businessNameColumn = "business_name";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(discussionsTable, {
    [businessNameColumn]: { type: "text", notNull: false },
  });

  pgm.sql(`
    UPDATE ${discussionsTable} d
    SET ${businessNameColumn} = COALESCE(e.customized_name, e.name)
    FROM establishments e
    WHERE d.siret = e.siret
  `);

  pgm.alterColumn(discussionsTable, businessNameColumn, {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(discussionsTable, businessNameColumn);
}
