import { MigrationBuilder } from "node-pg-migrate";

const frenchEstablishmentKinds = [
  "EI", // Entreprise Individuelle
  "EIRL", // Entreprise Individuelle à Responsabilité Limitée
  "EURL", // Entreprise Unipersonnelle à Responsabilité Limitée
  "SARL", // Société à Responsabilité Limitée
  "SA", // Société Anonyme
  "SAS", // Société par Actions Simplifiée
  "SASU", // Société par Actions Simplifiée Unipersonnelle
  "SC", // Société Civile
  "SCI", // Société Civile Immobilière
  "SCA", // Société en Commandite par Actions
  "SCM", // Société Civile de Moyens
  "SCOP", // Société Coopérative et Participative
  "SCP", // Société Civile Professionnelle
  "SNC", // Société en Nom Collectif
  "SELARL", // Société d'Exercice Libéral à Responsabilité Limitée
  "SELAS", // Société d'Exercice Libéral par Actions Simplifiée
  "SELCA", // Société d'Exercice Libéral en Commandite par Actions
  "SEL", // Société d'Exercice Libéral
  "SEP", // Société en Participation
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE establishments
    SET customized_name = NULL
    WHERE customized_name = ANY('{${frenchEstablishmentKinds.join(", ")}}'::text[]);
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
