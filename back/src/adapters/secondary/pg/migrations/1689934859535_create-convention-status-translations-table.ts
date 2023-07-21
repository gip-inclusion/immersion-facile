import { MigrationBuilder } from "node-pg-migrate";

const conventionStatusTranslationsTable = "convention_status_translations";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(conventionStatusTranslationsTable, {
    id: {
      type: "serial",
      primaryKey: true,
    },
    status: {
      type: "text",
      notNull: true,
    },
    translation: {
      type: "text",
      notNull: true,
    },
  });

  const statusesAndTranslation = [
    ["READY_TO_SIGN", "Prête à signer"],
    ["PARTIALLY_SIGNED", "Partiellement signée"],
    ["IN_REVIEW", "À valider le conseiller"],
    ["ACCEPTED_BY_COUNSELLOR", "À valider par le prescripteur"],
    ["ACCEPTED_BY_VALIDATOR", "Validée par le prescripteur"],
    ["REJECTED", "Rejetée"],
    ["DRAFT", "Demande de modification en cours"],
    ["CANCELLED", "Annulée"],
    ["DEPRECATED", "Obsolète"],
  ];

  pgm.sql(
    `INSERT INTO ${conventionStatusTranslationsTable} (status, translation) VALUES ${statusesAndTranslation
      .map(([status, traduction]) => `('${status}', '${traduction}')`)
      .join(", ")}`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(conventionStatusTranslationsTable);
}
