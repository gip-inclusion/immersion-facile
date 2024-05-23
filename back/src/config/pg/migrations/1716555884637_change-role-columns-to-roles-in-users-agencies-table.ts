import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users__agencies", {
    roles: { type: "jsonb", notNull: true, default: "[]" },
  });

  pgm.sql(`
  UPDATE users__agencies
  SET roles = jsonb_build_array(role)
  `);

  pgm.alterColumn("users__agencies", "roles", { default: null });

  pgm.dropColumns("users__agencies", ["role"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users__agencies", {
    role: {
      type: "agency_role",
      notNull: true,
      default: "'toReview'::agency_role",
    },
  });

  pgm.sql(`
    UPDATE users__agencies
    SET role = (roles->>0)::agency_role
  `);

  pgm.dropColumns("users__agencies", ["roles"]);
}
