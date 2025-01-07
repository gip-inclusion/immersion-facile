import { MigrationBuilder } from "node-pg-migrate";

const actorsTable = "actors";
const extraFieldsColumn = "extra_fields";
const newDefaultValue = "Non spécifié";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${actorsTable}
    SET ${extraFieldsColumn} = jsonb_set(
        ${extraFieldsColumn}, 
        '{job}', 
        '"${newDefaultValue}"', 
        false
        )
    WHERE ${extraFieldsColumn} ->> 'job' = '';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${actorsTable}
    SET ${extraFieldsColumn} = jsonb_set(
      ${extraFieldsColumn}, 
      '{job}', 
      '""', 
      false
    )
    WHERE ${extraFieldsColumn} ->> 'job' = '${newDefaultValue}';
  `);
}
