import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("authenticated_users", "users");
  pgm.renameTable("ongoing_oauths", "users_ongoing_oauths");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("users", "authenticated_users");
  pgm.renameTable("users_ongoing_oauths", "ongoing_oauths");
}
