import { MigrationBuilder } from "node-pg-migrate";

const userAdminTable = "users_admins";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(userAdminTable, {
    user_id: {
      type: "uuid",
      primaryKey: true,
      references: "users",
      onDelete: "CASCADE",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(userAdminTable);
}
