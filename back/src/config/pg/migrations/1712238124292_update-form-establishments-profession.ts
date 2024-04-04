/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  addRomeLabelInProfessions(pgm);
  addAppellationLabelInProfessions(pgm);
  renameAndDropProfessionsFields(pgm);
}

export async function down(): Promise<void> {}

const addRomeLabelInProfessions = (pgm: MigrationBuilder) => {
  pgm.sql(`
      UPDATE form_establishments
      SET professions = (
          SELECT jsonb_agg(
               CASE
                   WHEN element->>'romeCodeAppellation' is not null and element->>'romeCodeMetier' is null
                       THEN
                       jsonb_set(
                               element,
                               '{romeCodeMetier}',
                               (SELECT '"' || code_rome || '"' FROM public_appellations_data WHERE ogr_appellation = (element->>'romeCodeAppellation')::integer)::jsonb
                       )
                   WHEN element->>'romeCodeMetier' is not null and element->>'romeCodeAppellation' is null
                       THEN
                       jsonb_set(
                               element,
                               '{romeCodeAppellation}',
                               (SELECT '"' || ogr_appellation || '"' FROM public_appellations_data WHERE code_rome = element->>'romeCodeMetier' LIMIT 1)::jsonb
                       )
                   ELSE element
                   END
               )
          FROM jsonb_array_elements(professions) AS element
      )
      WHERE professions::text like '%"description"%';
  `);
  pgm.sql(`
    UPDATE form_establishments
    SET professions = (
        SELECT jsonb_agg(
                       jsonb_set(
                               element,
                               '{romeLabel}',
                               (SELECT '"' || libelle_rome || '"' FROM public_romes_data WHERE code_rome = element->>'romeCodeMetier')::jsonb
                       )
               )
        FROM jsonb_array_elements(professions) AS element
    )
    WHERE professions::text like '%romeCodeMetier%';`);
};

const addAppellationLabelInProfessions = (pgm: MigrationBuilder) => {
  pgm.sql(`
    UPDATE form_establishments
    SET professions = (
      SELECT jsonb_agg(
         jsonb_set(
             element,
             '{appellationLabel}',
             (SELECT '"' || public_appellations_data.libelle_appellation_court || '"' FROM public_appellations_data WHERE ogr_appellation = (element->>'romeCodeAppellation')::integer)::jsonb
         )
     )
      FROM jsonb_array_elements(professions) AS element
    )
    WHERE professions::text like '%romeCodeAppellation%';
  `);
};

const renameAndDropProfessionsFields = (pgm: MigrationBuilder) => {
  pgm.sql(`
    UPDATE form_establishments
    SET professions = (
        SELECT jsonb_agg(
           jsonb_set(
             jsonb_set(
               element,
               '{romeCode}',
               element->'romeCodeMetier'
             ) - 'romeCodeMetier',
             '{appellationCode}',
             element->'romeCodeAppellation'
           ) - 'romeCodeAppellation' - 'description'
     )
      FROM jsonb_array_elements(professions) AS element
    )
    WHERE professions::text like '%romeCodeAppellation%';
  `);
};
