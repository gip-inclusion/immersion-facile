import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `UPDATE agencies
    SET name = REGEXP_REPLACE(name, '(Pôle[- ]emploi|Pole[- ]emploi)', 'France Travail', 'gi')
    WHERE kind = 'pole-emploi' AND (name ILIKE '%Pôle%emploi%' OR name ILIKE '%Pole%emploi%');`,
  );
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
