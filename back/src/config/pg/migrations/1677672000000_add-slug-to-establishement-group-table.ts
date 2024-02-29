import type { MigrationBuilder } from "node-pg-migrate";

const establishmentGroupsTable = "establishment_groups";
const establishmentGroupsSiretsTable = "establishment_groups__sirets";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn(establishmentGroupsTable, "name", "slug");
  pgm.renameColumn(establishmentGroupsSiretsTable, "group_name", "group_slug");

  pgm.addColumn(establishmentGroupsTable, {
    name: { type: "text" },
  });

  pgm.sql(`
    UPDATE ${establishmentGroupsTable}
    SET name = slug
  `);

  pgm.alterColumn(establishmentGroupsTable, "name", {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(establishmentGroupsTable, "name");
  pgm.renameColumn(establishmentGroupsTable, "slug", "name");
  pgm.renameColumn(establishmentGroupsSiretsTable, "group_slug", "group_name");
}
