import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("convention_templates", {
    id: { type: "uuid", primaryKey: true },
    user_id: { type: "uuid", notNull: true, references: "users(id)" },
    name: { type: "text", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    agency_id: { type: "uuid" },
    agency_kind: { type: "text" },
    agency_department: { type: "text" },
    date_start: { type: "timestamptz" },
    date_end: { type: "timestamptz" },
    siret: { type: "text" },
    business_name: { type: "text" },
    schedule: { type: "jsonb" },
    individual_protection: { type: "boolean" },
    individual_protection_description: { type: "text" },
    sanitary_prevention: { type: "boolean" },
    sanitary_prevention_description: { type: "text" },
    immersion_address: { type: "text" },
    immersion_objective: { type: "text" },
    immersion_appellation: { type: "integer" },
    immersion_activities: { type: "text" },
    immersion_skills: { type: "text" },
    work_conditions: { type: "text" },
    internship_kind: { type: "text", notNull: true },
    business_advantages: { type: "text" },
    establishment_number_employees: { type: "text" },
    agency_referent_first_name: { type: "text" },
    agency_referent_last_name: { type: "text" },
    establishment_tutor: { type: "jsonb" },
    signatories: { type: "jsonb" },
  });

  pgm.addConstraint("convention_templates", "convention_templates_user_id_fk", {
    foreignKeys: {
      columns: "user_id",
      references: "users(id)",
    },
  });

  pgm.addConstraint(
    "convention_templates",
    "convention_templates_agency_id_fk",
    {
      foreignKeys: {
        columns: "agency_id",
        references: "agencies(id)",
      },
    },
  );

  pgm.addConstraint(
    "convention_templates",
    "convention_templates_immersion_appellation_fk",
    {
      foreignKeys: {
        columns: "immersion_appellation",
        references: "public_appellations_data(ogr_appellation)",
      },
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("convention_templates");
}
