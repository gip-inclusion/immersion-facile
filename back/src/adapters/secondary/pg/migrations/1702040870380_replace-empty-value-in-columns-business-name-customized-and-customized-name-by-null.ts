import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder) => {
  pgm.sql(`
    UPDATE establishments
    SET customized_name = NULL
    WHERE customized_name = '';
  `);

  pgm.sql(`
    UPDATE form_establishments
    SET business_name_customized = NULL
    WHERE business_name_customized = '';
  `);
};

export const down = (pgm: MigrationBuilder) => {
  pgm.sql(`
    UPDATE establishments
    SET customized_name = ''
    WHERE customized_name IS NULL;
  `);

  pgm.sql(`
    UPDATE form_establishments
    SET business_name_customized = ''
    WHERE business_name_customized IS NULL;
  `);
};
