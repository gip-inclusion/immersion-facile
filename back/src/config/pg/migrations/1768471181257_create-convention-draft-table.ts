/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("convention_drafts", {
    id: { type: "uuid", primaryKey: true },
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
    acquisition_campaign: { type: "text" },
    acquisition_keyword: { type: "text" },
    establishment_number_employees: { type: "text" },
    agency_referent_first_name: { type: "text" },
    agency_referent_last_name: { type: "text" },
    ft_connect_id: { type: "uuid" },
    establishment_tutor: { type: "jsonb" },
    signatories: { type: "jsonb" },
  });

  pgm.addConstraint("convention_drafts", "convention_drafts_agency_id_fk", {
    foreignKeys: {
      columns: "agency_id",
      references: "agencies(id)",
    },
  });

  pgm.addConstraint(
    "convention_drafts",
    "convention_drafts_immersion_appellation_fk",
    {
      foreignKeys: {
        columns: "immersion_appellation",
        references: "public_appellations_data(ogr_appellation)",
      },
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("convention_drafts");
}
