import { MigrationBuilder } from "node-pg-migrate";

const ongoingOAuthTableName = "ongoing_oauths";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(ongoingOAuthTableName, {
    state: { type: "uuid", primaryKey: true },
    nonce: { type: "text", notNull: true },
    provider: { type: "text", notNull: true },
    user_id: { type: "uuid" },
    external_id: { type: "text" },
    access_token: { type: "text" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(ongoingOAuthTableName);
}
