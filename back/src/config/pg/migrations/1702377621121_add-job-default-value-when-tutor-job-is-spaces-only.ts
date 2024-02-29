import { MigrationBuilder } from "node-pg-migrate";

const newDefaultValue = "Fonction non spécifiée.";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE actors
    SET extra_fields = jsonb_set( extra_fields, '{job}', '"${newDefaultValue}"', false )
    WHERE actors.id IN
    (
      SELECT id
      FROM actors
      WHERE TRIM(BOTH ' ' FROM extra_fields->>'job') = ''
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE actors
    SET extra_fields = jsonb_set( extra_fields, '{job}', '"   "', false )
    WHERE actors.id IN
    (
      SELECT id
      FROM actors
      WHERE extra_fields->>'job' = '${newDefaultValue}'
    );
  `);
}
