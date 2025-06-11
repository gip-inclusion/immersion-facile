import type { MigrationBuilder } from "node-pg-migrate";
const tableName = "feature_flags";
const flagNames = {
  entreprise: "enableEstablishmentDashboardHighlight",
  agence: "enableAgencyDashboardHighlight",
};

export async function up(pgm: MigrationBuilder): Promise<void> {
  Object.entries(flagNames).forEach(([kind, flagName]) => {
    pgm.sql(`
      INSERT INTO ${tableName} (flag_name, kind, is_active, value)
      VALUES ('${flagName}', 'highlight', false, '{"title": "Titre par défaut pour ${kind}" , "message": "Message par défaut pour ${kind}","href":"https://www.exemple.com", "label":"Bouton par défaut pour ${kind}" }');
    `);
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  Object.values(flagNames).forEach((flagName) => {
    pgm.sql(`
      DELETE FROM ${tableName} WHERE flag_name = '${flagName}';
    `);
  });
}
