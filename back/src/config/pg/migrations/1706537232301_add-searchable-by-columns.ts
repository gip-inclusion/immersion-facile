/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableNames = ["form_establishments", "establishments"];
const searchableByStudentColumnName = "searchable_by_students";
const searchableByJobSeekerColumnName = "searchable_by_job_seekers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  tableNames.forEach((tableName) => {
    pgm.addColumn(tableName, {
      [searchableByStudentColumnName]: {
        type: "boolean",
        notNull: true,
        default: true,
      },
      [searchableByJobSeekerColumnName]: {
        type: "boolean",
        notNull: true,
        default: true,
      },
    });
    pgm.alterColumn(tableName, searchableByStudentColumnName, {
      default: null,
    });
    pgm.alterColumn(tableName, searchableByJobSeekerColumnName, {
      default: null,
    });
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  tableNames.forEach((tableName) => {
    pgm.dropColumns(tableName, [
      searchableByStudentColumnName,
      searchableByJobSeekerColumnName,
    ]);
  });
}
