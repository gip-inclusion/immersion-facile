/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("convention_draft", {
    id: { type: "uuid", primaryKey: true },
    created_at: { type: "timestamptz", notNull: true },
    updated_at: { type: "timestamptz", notNull: true },
    agency_id: { type: "uuid", notNull: true },
    date_start: { type: "timestamptz", notNull: true },
    date_end: { type: "timestamptz", notNull: true },
    siret: { type: "text", notNull: true },
    business_name: { type: "text", notNull: true },
    schedule: { type: "jsonb", notNull: true },
    individual_protection: { type: "boolean", notNull: true },
    individual_protection_description: { type: "text", notNull: true },
    sanitary_prevention: { type: "boolean", notNull: true },
    sanitary_prevention_description: { type: "text", notNull: true },
    immersion_address: { type: "text", notNull: true },
    immersion_objective: { type: "text", notNull: true },
    immersion_appellation: { type: "text", notNull: true },
    immersion_activities: { type: "text", notNull: true },
    immersion_skills: { type: "text", notNull: true },
    work_conditions: { type: "text", notNull: true },
    internship_kind: { type: "text", notNull: true },
    business_advantages: { type: "text", notNull: true },
    acquisition_campaign: { type: "text", notNull: true },
    acquisition_keyword: { type: "text", notNull: true },
    establishment_number_employees: { type: "text", notNull: true },
    establishment_tutor_email: { type: "text", notNull: true },
    establishment_tutor_phone: { type: "text", notNull: true },
    establishment_tutor_first_name: { type: "text", notNull: true },
    establishment_tutor_last_name: { type: "text", notNull: true },
    agency_referent_first_name: { type: "text", notNull: true },
    agency_referent_last_name: { type: "text", notNull: true },
    ft_connect_id: { type: "uuid", notNull: true },
    //signatories ?
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {}
