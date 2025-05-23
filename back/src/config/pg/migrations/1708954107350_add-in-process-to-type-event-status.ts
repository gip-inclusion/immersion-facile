import type { MigrationBuilder } from "node-pg-migrate";

export async function up(_pgm: MigrationBuilder): Promise<void> {
  // content deleted to created whole enum type in a same transaction
  // see PR #3323
}

export async function down(_pgm: MigrationBuilder): Promise<void> {
  // no easy way to remove a type value in node-pg-migrate so we'll just leave it
}
