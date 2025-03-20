import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("discussions", "establishment_contact_copy_emails", {
    name: "idx_establishment_contact_copy_emails",
    method: "gin",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("discussions", "establishment_contact_copy_emails", {
    name: "idx_establishment_contact_copy_emails",
  });
}
