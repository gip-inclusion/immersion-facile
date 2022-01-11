import type { MigrationBuilder } from "node-pg-migrate";
import { immersion_applications } from "../staticData/0_table_names";

const timestamp = (pgm: MigrationBuilder) => ({
  type: "timestamp",
  default: pgm.func("now()"),
});

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable(immersion_applications, {
    id: { type: "uuid", primaryKey: true },
    created_at: timestamp(pgm),
    updated_at: timestamp(pgm),
    status: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(255)", notNull: true },
    first_name: { type: "varchar(255)", notNull: true },
    last_name: { type: "varchar(255)", notNull: true },
    phone: { type: "varchar(255)" },
    agency_id: { type: "uuid", notNull: true },
    date_submission: { type: "timestamp", notNull: true },
    date_start: { type: "timestamp", notNull: true },
    date_end: { type: "timestamp", notNull: true },
    siret: { type: "char(14)", notNull: true },
    business_name: { type: "varchar(255)", notNull: true },
    mentor: { type: "varchar(255)", notNull: true },
    mentor_phone: { type: "varchar(255)", notNull: true },
    mentor_email: { type: "varchar(255)", notNull: true },
    schedule: { type: "jsonb", notNull: true },
    individual_protection: { type: "bool", notNull: true },
    sanitary_prevention: { type: "bool", notNull: true },
    sanitary_prevention_description: { type: "varchar(255)" },
    immersion_address: { type: "varchar(255)" },
    immersion_objective: { type: "varchar(255)" },
    immersion_profession: { type: "varchar(255)", notNull: true },
    immersion_activities: { type: "varchar(255)", notNull: true },
    immersion_skills: { type: "varchar(255)" },
    beneficiary_accepted: { type: "bool", notNull: true },
    enterprise_accepted: { type: "bool", notNull: true },
    postal_code: { type: "char(5)" },
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable(immersion_applications);
};
