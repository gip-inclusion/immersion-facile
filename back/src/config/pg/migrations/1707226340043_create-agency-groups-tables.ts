import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("agency_group_kind", ["france-travail"]);
  pgm.createType("agency_group_scope", [
    "direction-territoriale",
    "direction-régionale",
  ]);

  pgm.createTable("agency_groups", {
    id: { type: "serial", primaryKey: true },
    siret: { type: "char(14)", notNull: true },
    name: { type: "text", notNull: true },
    email: { type: "text", notNull: false },
    cc_emails: { type: "jsonb", notNull: false },
    departments: { type: "jsonb", notNull: true },
    // France Travail related (there are only FT related agency groups for now)
    kind: { type: "agency_group_kind", notNull: true },
    scope: { type: "agency_group_scope", notNull: true },
    code_safir: { type: "text", notNull: true, unique: true },
  });

  pgm.createIndex("agency_groups", ["siret", "kind", "scope"], {
    unique: true,
  });

  pgm.createTable("agency_groups__agencies", {
    agency_group_id: {
      type: "int",
      references: "agency_groups",
      notNull: true,
    },
    agency_id: { type: "uuid", notNull: true, references: "agencies" },
  });

  // makes [siret, agency_id] pair unique
  pgm.createIndex("agency_groups__agencies", ["agency_group_id", "agency_id"], {
    unique: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("agency_groups__agencies");
  pgm.dropTable("agency_groups");
  pgm.dropType("agency_group_kind");
  pgm.dropType("agency_group_scope");
}
