/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "form_establishments";
const searchableByStudentColumnName = "searchable_by_student";
const searchableByJobSeekerColumnName = "searchable_by_job_seeker";

export async function up(pgm: MigrationBuilder): Promise<void> {
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
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, [
    searchableByStudentColumnName,
    searchableByJobSeekerColumnName,
  ]);
}
