import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(
    "view_appellations_dto",
    {},
    `SELECT 
        ogr_appellation AS appellation_code,
        libelle_appellation_court AS appellation_label, 
        prd.code_rome AS rome_code,
        prd.libelle_rome AS rome_label
      FROM public_appellations_data AS pad 
      JOIN public_romes_data AS prd
      ON pad.code_rome = prd.code_rome
  `,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_appellations_dto");
}
