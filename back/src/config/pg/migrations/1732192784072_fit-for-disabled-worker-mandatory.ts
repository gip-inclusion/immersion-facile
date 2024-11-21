import { MigrationBuilder } from "node-pg-migrate";

const establishmentTableName = "establishments";
const formEstablishmentTableName = "form_establishments";
const fitForDisabledWorkersColumnName = "fit_for_disabled_workers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${establishmentTableName}
    SET ${fitForDisabledWorkersColumnName}  = false
    WHERE ${fitForDisabledWorkersColumnName} IS NULL
  `);
  pgm.sql(`
    ALTER TABLE ${establishmentTableName} ALTER COLUMN ${fitForDisabledWorkersColumnName} DROP DEFAULT;
    ALTER TABLE ${establishmentTableName} ALTER COLUMN ${fitForDisabledWorkersColumnName} SET NOT NULL;
  `);

  pgm.sql(`
    UPDATE ${formEstablishmentTableName}
    SET ${fitForDisabledWorkersColumnName}  = false
    WHERE ${fitForDisabledWorkersColumnName} IS NULL
  `);
  pgm.sql(`
    ALTER TABLE ${formEstablishmentTableName} ALTER COLUMN ${fitForDisabledWorkersColumnName} DROP DEFAULT;
    ALTER TABLE ${formEstablishmentTableName} ALTER COLUMN ${fitForDisabledWorkersColumnName} SET NOT NULL;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn(establishmentTableName, fitForDisabledWorkersColumnName, {
    notNull: false,
    default: false,
  });

  pgm.alterColumn(formEstablishmentTableName, fitForDisabledWorkersColumnName, {
    notNull: false,
    default: false,
  });
}
