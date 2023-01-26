import type { MigrationBuilder } from "node-pg-migrate";

const timestampTz = (pgm: MigrationBuilder) => ({
  type: "timestamptz",
  notNull: true,
  default: pgm.func("now()"),
});

const establishmentGroupsTable = "establishment_groups";
const establishmentGroupsSiretsTable = "establishment_groups__sirets";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(establishmentGroupsTable, {
    name: { type: "text", unique: true, primaryKey: true },
    created_at: timestampTz(pgm),
    updated_at: timestampTz(pgm),
  });

  pgm.createTable(establishmentGroupsSiretsTable, {
    group_name: {
      type: "text",
      notNull: true,
      references: establishmentGroupsTable,
      onDelete: "CASCADE",
    },
    siret: { type: "char(14)", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(establishmentGroupsSiretsTable);
  pgm.dropTable(establishmentGroupsTable);
}
