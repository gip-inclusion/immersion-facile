import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
      DELETE FROM ongoing_oauths
      WHERE (ongoing_oauths.external_id, ongoing_oauths.created_at, ongoing_oauths.state, ongoing_oauths.nonce) in (
          SELECT ongoing_oauths.external_id external_id, ongoing_oauths.created_at created_at, ongoing_oauths.state state, ongoing_oauths.nonce nonce
          from ongoing_oauths
                   LEFT JOIN authenticated_users on ongoing_oauths.user_id = authenticated_users.id
          WHERE authenticated_users.id is null
            and ongoing_oauths.external_id is not null
      );
  `);
}

export async function down(): Promise<void> {}
