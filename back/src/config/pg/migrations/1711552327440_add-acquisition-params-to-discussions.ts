import { MigrationBuilder } from "node-pg-migrate";

const tableName = "discussions";
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
  pgm.addColumns(tableName, acquisitionColumns);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, [campaignColumnName, keywordColumnName]);
}
