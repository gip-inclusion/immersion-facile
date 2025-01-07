import { MigrationBuilder } from "node-pg-migrate";

const regionTableName = "public_department_region";
const searchesMadeTableName = "searches_made";

const gpsColumnName = "gps";
const shapeColumnName = "shape";
const updateDateColumnName = "update_date";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex(regionTableName, shapeColumnName, { method: "gist" });
  pgm.createIndex(searchesMadeTableName, gpsColumnName, { method: "gist" });
  pgm.createIndex(searchesMadeTableName, updateDateColumnName);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(regionTableName, shapeColumnName);
  pgm.dropIndex(searchesMadeTableName, gpsColumnName);
  pgm.dropIndex(searchesMadeTableName, updateDateColumnName);
}
