import { MigrationBuilder } from "node-pg-migrate";

const timestampTz = (pgm: MigrationBuilder) => ({
  type: "timestamptz",
  notNull: true,
  default: pgm.func("now()"),
});

const authenticatedUsersTableName = "authenticated_users";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(authenticatedUsersTableName, {
    id: { type: "uuid", primaryKey: true },
    email: { type: "text", unique: true, notNull: true },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
    created_at: timestampTz(pgm),
    updated_at: timestampTz(pgm),
  });

  pgm.addIndex(authenticatedUsersTableName, "email");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(authenticatedUsersTableName);
}
