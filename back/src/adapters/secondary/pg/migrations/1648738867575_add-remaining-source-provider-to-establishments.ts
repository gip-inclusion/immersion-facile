/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(` 
    UPDATE establishments
    SET source_provider = 'api_labonneboite'
    WHERE establishments.data_source = 'api_labonneboite';
  `);

  await pgm.sql(` 
    UPDATE establishments
    SET source_provider = 'api_laplateformedelinclusion'
    WHERE establishments.data_source = 'api_laplateformedelinclusion';
  `);

  pgm.alterColumn("establishments", "source_provider", {
    type: "varchar(255)",
    notNull: true,
  });

  pgm.alterColumn("establishments", "data_source", {
    type: "varchar(255)",
    notNull: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function down(): Promise<void> {}
