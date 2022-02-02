import type { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable("form_establishments", {
    id: { type: "uuid", primaryKey: true },
    created_at: { type: "timestamp", default: pgm.func("now()") },
    updated_at: { type: "timestamp", default: pgm.func("now()") },
    siret: { type: "char(14)", notNull: true },
    business_name_customized: { type: "varchar(255)" },
    business_name: { type: "varchar(255)", notNull: true },
    business_address: { type: "varchar(255)", notNull: true },
    naf: { type: "jsonb" },
    professions: { type: "jsonb", notNull: true },
    business_contacts: { type: "jsonb", notNull: true },
    preferred_contact_methods: { type: "jsonb", notNull: true },
    is_engaged_enterprise: { type: "bool" },
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("form_establishments");
};
