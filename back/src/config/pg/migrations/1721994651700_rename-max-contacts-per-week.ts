import { MigrationBuilder } from "node-pg-migrate";

const establishmentTableName = "establishments";
const formEstablishmentTableName = "form_establishments";
const oldColumnName = "max_contacts_per_week";
const newColumnName = "max_contacts_per_month";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(formEstablishmentTableName, oldColumnName, newColumnName);
  pgm.renameColumn(establishmentTableName, oldColumnName, newColumnName);
  pgm.sql(`
    UPDATE ${establishmentTableName}
    SET ${newColumnName} = ${newColumnName} * 4;
  `);
  pgm.sql(`
    UPDATE ${formEstablishmentTableName}
    SET ${newColumnName} = ${newColumnName} * 4;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${establishmentTableName}
    SET ${newColumnName} = ${newColumnName} / 4;
  `);
  pgm.sql(`
    UPDATE ${formEstablishmentTableName}
    SET ${newColumnName} = ${newColumnName} / 4;
  `);
  pgm.renameColumn(establishmentTableName, newColumnName, oldColumnName);
  pgm.renameColumn(formEstablishmentTableName, newColumnName, oldColumnName);
}
