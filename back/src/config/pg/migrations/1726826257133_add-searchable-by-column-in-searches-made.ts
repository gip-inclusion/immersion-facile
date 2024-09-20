import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType("searchable_by", ["students", "jobSeekers"]);
  pgm.addColumn("searches_made", {
    searchable_by: { type: "searchable_by" },
  });

  await pgm.db.query(`
    DELETE FROM searches_made__appellation_code where appellation_code is null;
  `);
  pgm.alterColumn("searches_made__appellation_code", "appellation_code", {
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("searches_made", "searchable_by");
  pgm.dropType("searchable_by");
  pgm.alterColumn("searches_made__appellation_code", "appellation_code", {
    notNull: false,
  });
}
