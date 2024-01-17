import { MigrationBuilder } from "node-pg-migrate";

const agencyTableName = "agencies";
const siretColumnName = "agency_siret";
const defaultSiret = "000000000000000";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${agencyTableName}
    SET ${siretColumnName} = '${defaultSiret}'
    WHERE ${siretColumnName} IS NULL;
  `);
  pgm.alterColumn(agencyTableName, siretColumnName, {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(agencyTableName, siretColumnName, {
    notNull: false,
  });
  pgm.sql(`
    UPDATE ${agencyTableName}
    SET ${siretColumnName} = NULL
    WHERE ${siretColumnName} = '${defaultSiret}';
  `);
}
