import type { MigrationBuilder } from "node-pg-migrate";
import departments from "../static-data/departements-outre-mer-manquants.json";

// coordonnées sur https://geo2day.com/north_america/saint_pierre_et_miquelon.geojson
export async function up(pgm: MigrationBuilder): Promise<void> {
  for (const department of departments.features)
    pgm.sql(
      `
      INSERT INTO public_department_region (department_code, department_name, region_name, shape_backup, shape)
      VALUES ('${department.properties.code}', '${department.properties.name}', '${department.properties.name}', ST_GeomFromGeoJSON('${JSON.stringify(department.geometry)}'), ST_GeomFromGeoJSON('${JSON.stringify(department.geometry)}'))
  `,
    );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `DELETE FROM public_department_region WHERE department_code IN ('975', '977', '978')`,
  );
}
