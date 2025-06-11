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
      VALUES ('${flagName}', 'highlight', false, '{"title": "Titre par défaut" , "message": "Message par défaut","href":"https://www.exemple.com", "label":"Bouton par défaut" }');
    `);
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DELETE FROM ${tableName} WHERE flag_name IN (${flagNames.map((flagName) => `'${flagName}'`).join(",")});
  `);
}
