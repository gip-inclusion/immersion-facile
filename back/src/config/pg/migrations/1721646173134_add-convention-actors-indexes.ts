import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("conventions", "beneficiary_id");
  pgm.createIndex("conventions", "establishment_tutor_id");
  pgm.createIndex("conventions", "establishment_representative_id");
  pgm.createIndex("conventions", "beneficiary_representative_id");
  pgm.createIndex("conventions", "beneficiary_current_employer_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("conventions", "beneficiary_id");
  pgm.dropIndex("conventions", "establishment_tutor_id");
  pgm.dropIndex("conventions", "establishment_representative_id");
  pgm.dropIndex("conventions", "beneficiary_representative_id");
  pgm.dropIndex("conventions", "beneficiary_current_employer_id");
}
