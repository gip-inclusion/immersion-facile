import { MigrationBuilder } from "node-pg-migrate";

const newDefaultValue = "Non spécifié.";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE actors
    SET extra_fields = jsonb_set( extra_fields, '{job}', '"${newDefaultValue}"', true )
    WHERE actors.id IN
    (
      SELECT establishment_tutor_id
      FROM conventions
      LEFT JOIN actors ON establishment_tutor_id = actors.id
      WHERE (actors.extra_fields ->> 'job') IS NULL
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE actors
    SET extra_fields = extra_fields::jsonb - 'job'
    WHERE extra_fields ->> 'job' = '${newDefaultValue}';
  `);
}
