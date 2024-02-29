import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("establishments", {
    lat: {
      type: "float8",
      notNull: true,
      default: 0,
    },
    lon: {
      type: "float8",
      notNull: true,
      default: 0,
    },
  });
  await pgm.sql(`
  UPDATE establishments 
  SET 
  lon=(((ST_AsGeoJSON(gps))::json -> 'coordinates') ->> 0)::float8,
  lat=(((ST_AsGeoJSON(gps))::json -> 'coordinates') ->> 1)::float8`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("establishments", ["lat", "lon"]);
}
