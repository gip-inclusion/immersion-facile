import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("agencies", "questionnaire_url", {
    type: "varchar(600)",
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("agencies", "questionnaire_url", {
    type: "varchar(255)",
    notNull: true,
  });
}
