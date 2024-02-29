import { MigrationBuilder } from "node-pg-migrate";
import departments from "../static-data/departements-avec-outre-mer.json";
const tableName = "public_department_region";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(tableName, {
    shape: {
      type: "geometry",
      notNull: false,
    },
  });
  for (const department of departments.features)
    pgm.sql(
      `
      UPDATE ${tableName}
      SET shape = ST_GeomFromGeoJSON('${JSON.stringify(department.geometry)}')
      WHERE department_code = '${department.properties.code}'
  `,
    );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(tableName, "shape");
}
