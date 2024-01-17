import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("agencies", "questionnaire_url", {
    notNull: false,
  });
  pgm.sql(`
  UPDATE "agencies"
  SET "questionnaire_url" = NULL
  WHERE "questionnaire_url" NOT LIKE 'http%';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
  UPDATE "agencies"
  SET "questionnaire_url" = ''
  WHERE "questionnaire_url" IS NULL;

  `);
  pgm.alterColumn("agencies", "questionnaire_url", {
    notNull: true,
  });
}
