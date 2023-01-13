import { MigrationBuilder } from "node-pg-migrate";

const authenticatedUsersTableName = "authenticated_users";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(authenticatedUsersTableName, {
    id: { type: "uuid", primaryKey: true },
    email: { type: "text", unique: true, notNull: true },
    first_name: { type: "text", notNull: true },
    last_name: { type: "text", notNull: true },
  });

  pgm.addIndex(authenticatedUsersTableName, "email");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(authenticatedUsersTableName);
}
