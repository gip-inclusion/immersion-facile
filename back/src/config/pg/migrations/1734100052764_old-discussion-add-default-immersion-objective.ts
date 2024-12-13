/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE discussions
    SET immersion_objective = 'Découvrir un métier ou un secteur d''activité'
    WHERE immersion_objective IS NULL
    AND contact_method = 'EMAIL'
  `);
}

export async function down(_: MigrationBuilder): Promise<void> {}
