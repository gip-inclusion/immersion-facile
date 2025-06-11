import type { MigrationBuilder } from "node-pg-migrate";
const tableName = "feature_flags";
const flagNames = [
  "enableEstablishmentDashboardHighlight",
  "enableAgencyDashboardHighlight",
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  flagNames.forEach((flagName) => {
    pgm.sql(`
      INSERT INTO ${tableName} (flag_name, kind, is_active, value)
      VALUES ('${flagName}', 'highlight', false, '{"title": "" , "message": "message","href":"https://href", "label":"label" }');
    `);
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM ${tableName} WHERE flag_name IN (${flagNames.map((flagName) => `'${flagName}'`).join(",")});
  `);
}
