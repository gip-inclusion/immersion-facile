/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addIndex("users_ongoing_oauths", "updated_at");
  pgm.addIndex("users_ongoing_oauths", "user_id");

  pgm.addColumn("users", {
    last_login_at: {
      type: "timestamptz",
      notNull: false,
    },
  });

  // user that has never logged in : last_login_at = null
  pgm.sql(`
    UPDATE users
    SET last_login_at = uo.latest_updated_at
    FROM (
        SELECT user_id, MAX(updated_at) AS latest_updated_at
        FROM users_ongoing_oauths
        GROUP BY user_id
    ) AS uo
    WHERE users.id = uo.user_id
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("users_ongoing_oauths", ["updated_at"]);
  pgm.dropIndex("users_ongoing_oauths", ["user_id"]);
  pgm.dropColumn("users", "last_login_at");
}
