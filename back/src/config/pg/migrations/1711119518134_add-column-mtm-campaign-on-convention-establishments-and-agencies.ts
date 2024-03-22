import { MigrationBuilder } from "node-pg-migrate";

const mtmColumns = {
  mtm_campaign: {
    type: "text",
    notNull: false,
  },
  mtm_keyword: {
    type: "text",
    notNull: false,
  },
};
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("conventions", mtmColumns);
  pgm.addColumn("form_establishments", mtmColumns);
  pgm.addColumn("establishments", mtmColumns);
  pgm.addColumn("agencies", mtmColumns);
  pgm.addColumn("searches_made", mtmColumns);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("conventions", ["mtm_campaign", "mtm_keyword"]);
  pgm.dropColumn("establishments", ["mtm_campaign", "mtm_keyword"]);
  pgm.dropColumn("form_establishments", ["mtm_campaign", "mtm_keyword"]);
  pgm.dropColumn("agencies", ["mtm_campaign", "mtm_keyword"]);
  pgm.dropColumn("searches_made", ["mtm_campaign", "mtm_keyword"]);
}
