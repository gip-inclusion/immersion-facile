import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("agencies", "code", "code_safir");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("agencies", "code_safir", "code");
}
