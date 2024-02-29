import { MigrationBuilder } from "node-pg-migrate";

const timestampTz = (pgm: MigrationBuilder) => ({
  type: "timestamptz",
  notNull: true,
  default: pgm.func("now()"),
});

const ongoingOAuthTableName = "ongoing_oauths";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(ongoingOAuthTableName, {
    state: { type: "uuid", primaryKey: true },
    nonce: { type: "text", notNull: true },
    provider: { type: "text", notNull: true },
    user_id: { type: "uuid" },
    external_id: { type: "text" },
    access_token: { type: "text" },
    created_at: timestampTz(pgm),
    updated_at: timestampTz(pgm),
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(ongoingOAuthTableName);
}
