import { MigrationBuilder } from "node-pg-migrate";

const agencyTable = "agencies";
const coveredDepartmentsColumn = "covered_departments";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(agencyTable, {
    [coveredDepartmentsColumn]: {
      type: "jsonb",
      default: "[]",
      notNull: true,
    },
  });

  pgm.sql(`
    UPDATE ${agencyTable}
    SET ${coveredDepartmentsColumn} = jsonb_build_array(department_code);
    `);

  pgm.alterColumn(agencyTable, coveredDepartmentsColumn, {
    type: "jsonb",
    default: null, // in order to get an error when try to insert null
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(agencyTable, coveredDepartmentsColumn);
}
