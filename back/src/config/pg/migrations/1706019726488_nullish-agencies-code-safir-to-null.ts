import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const tableName = "agencies";
  const codeSafirColumnName = "code_safir";
  pgm.sql(`
    UPDATE ${tableName} 
    SET ${codeSafirColumnName} = NULL
    WHERE ${codeSafirColumnName} = ''
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {
  // NOT NECESSARY
}
