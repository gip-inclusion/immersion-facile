import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE discussions 
    SET status = 'ACCEPTED'
    FROM conventions
    WHERE discussions.convention_id::uuid = conventions.id
    AND discussions.convention_id IS NOT NULL
    AND discussions.status = 'PENDING'
    `);
}

export async function down(): Promise<void> {}
