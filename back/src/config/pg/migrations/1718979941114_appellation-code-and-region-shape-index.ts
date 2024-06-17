/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const appellationCodeTable = "searches_made__appellation_code";
const appellationDataTable = "public_appellations_data";
const publicDepartmentRegionTable = "public_department_region";

const codeColumnName = "search_made_id";
const dataColumName = "ogr_appellation";
const publicDepartmentRegionOldColumn = "shape";
const publicDepartmentRegionNewColumn = "shape_backup";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex(appellationCodeTable, codeColumnName);
  pgm.createIndex(appellationDataTable, dataColumName);
  pgm.renameColumn(
    publicDepartmentRegionTable,
    publicDepartmentRegionOldColumn,
    publicDepartmentRegionNewColumn,
  );

  pgm.sql(`
  -- Step 1: Add a new temporary column
  ALTER TABLE "public_department_region"
  ADD COLUMN "shape" geography;
  
  -- Step 2: Update the new column with the converted data
  UPDATE "public_department_region"
  SET "shape" = shape_backup::geography
  WHERE "shape" IS NULL; 
  
  -- Step 5: Recreate the index
  DROP INDEX IF EXISTS public_department_region_shape_index;
  CREATE INDEX public_department_region_shape_index
  ON public_department_region USING gist (shape);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(appellationCodeTable, codeColumnName);
  pgm.dropIndex(appellationDataTable, dataColumName);
  pgm.dropColumn(publicDepartmentRegionTable, publicDepartmentRegionOldColumn);
  pgm.renameColumn(
    publicDepartmentRegionTable,
    publicDepartmentRegionNewColumn,
    publicDepartmentRegionOldColumn,
  );
}
