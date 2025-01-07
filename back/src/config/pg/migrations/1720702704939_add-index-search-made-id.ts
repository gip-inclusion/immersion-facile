import { MigrationBuilder } from "node-pg-migrate";

// table variables
const searchMadeTable = "searches_made";
const publicDepartmentTable = "public_department_region";
const searchMadeAppellationTable = "searches_made__appellation_code";

// column variables
const searchNumResults = "number_of_results";
const departmentShapeBackup = "shape_backup";
const searchAppellationCode = "appellation_code";
const searchGps = "gps";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(searchMadeTable, searchGps);
  pgm.addIndex(searchMadeTable, searchGps, { method: "spgist" });
  pgm.addIndex(searchMadeTable, searchNumResults);
  pgm.addIndex(publicDepartmentTable, departmentShapeBackup, {
    method: "gist",
  });
  pgm.addIndex(searchMadeAppellationTable, searchAppellationCode);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex(searchMadeTable, searchGps);
  pgm.addIndex(searchMadeTable, searchGps, { method: "gist" });
  pgm.dropIndex(searchMadeTable, searchNumResults);
  pgm.dropIndex(publicDepartmentTable, departmentShapeBackup);
  pgm.dropIndex(searchMadeAppellationTable, searchAppellationCode);
}
