/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("discussions", {
    updated_at: {
      type: "timestamptz",
      notNull: false,
    },
  });

  pgm.sql(`
    UPDATE discussions
    SET updated_at = (
      SELECT MAX(exchanges.sent_at) + interval '3 months'
      FROM exchanges
      WHERE exchanges.discussion_id = discussions.id
    )
    WHERE discussions.rejection_kind = 'DEPRECATED'
  `);

  pgm.sql(`
    UPDATE discussions
    SET updated_at = (
      SELECT MAX(exchanges.sent_at)
      FROM exchanges
      WHERE exchanges.discussion_id = discussions.id
    )
    WHERE discussions.rejection_kind != 'DEPRECATED'
    OR discussions.rejection_kind IS NULL
  `);

  pgm.alterColumn("discussions", "updated_at", {
    notNull: true,
  });
  pgm.alterColumn("discussions", "status", {
    notNull: true,
    default: null,
  });
  pgm.createIndex("discussions", "status");
  pgm.createIndex("discussions", "updated_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("discussions", "updated_at");
  pgm.dropIndex("discussions", "status");
  pgm.dropColumn("discussions", "updated_at");
}
