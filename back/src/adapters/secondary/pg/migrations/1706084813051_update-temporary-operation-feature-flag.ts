import { MigrationBuilder } from "node-pg-migrate";
const tableName = "feature_flags";
const flagName = "enableTemporaryOperation";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET
      kind = 'textImageAndRedirect',
      is_active = false,
      value = '{"message": "message","imageUrl": "https://imageUrl", "redirectUrl":"https://redirectUrl","imageAlt":"", "title": "", "overtitle": "" }'
    WHERE flag_name = '${flagName}'
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE ${tableName}
    SET
      kind = 'boolean',
      is_active = true,
      value = NULL
    WHERE flag_name = '${flagName}'
  `);
}
