import { MigrationBuilder } from "node-pg-migrate";

const campaignColumnName = "acquisition_campaign";
const keywordColumnName = "acquisition_keyword";

const acquisitionColumns = {
  [campaignColumnName]: {
    type: "text",
    notNull: false,
  },
  [keywordColumnName]: {
    type: "text",
    notNull: false,
  },
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("conventions", acquisitionColumns);
  pgm.addColumns("form_establishments", acquisitionColumns);
  pgm.addColumns("establishments", acquisitionColumns);
  pgm.addColumns("agencies", acquisitionColumns);
  pgm.addColumns("searches_made", acquisitionColumns);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("conventions", [campaignColumnName, keywordColumnName]);
  pgm.dropColumn("establishments", [campaignColumnName, keywordColumnName]);
  pgm.dropColumn("form_establishments", [
    campaignColumnName,
    keywordColumnName,
  ]);
  pgm.dropColumn("agencies", [campaignColumnName, keywordColumnName]);
  pgm.dropColumn("searches_made", [campaignColumnName, keywordColumnName]);
}
