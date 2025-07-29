import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("establishments", {
    welcome_address_street_number_and_address: {
      type: "string",
      default: null,
    },
    welcome_address_postcode: {
      type: "string",
      default: null,
    },
    welcome_address_city: {
      type: "string",
      default: null,
    },
    welcome_address_department_code: {
      type: "string",
      default: null,
    },
    welcome_address_lat: {
      type: "DOUBLE PRECISION",
      default: null,
    },
    welcome_address_lon: {
      type: "DOUBLE PRECISION",
      default: null,
    },
  });

  pgm.sql(`
    WITH first_location_info AS (
      SELECT DISTINCT ON (establishment_siret) *
      FROM establishments_location_infos
    )
    UPDATE establishments
    SET welcome_address_street_number_and_address = first_location_info.street_number_and_address,
    welcome_address_postcode = first_location_info.post_code,
    welcome_address_city = first_location_info.city,
    welcome_address_department_code = first_location_info.department_code,
    welcome_address_lat = first_location_info.lat,
    welcome_address_lon = first_location_info.lon
    FROM first_location_info
    WHERE establishments.siret = first_location_info.establishment_siret;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("establishments", [
    "welcome_address_street_number_and_address",
    "welcome_address_postcode",
    "welcome_address_city",
    "welcome_address_department_code",
    "welcome_address_lat",
    "welcome_address_lon",
  ]);
}
