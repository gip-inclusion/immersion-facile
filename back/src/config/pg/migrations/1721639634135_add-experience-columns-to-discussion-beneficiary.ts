/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "discussions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(tableName, {
    potential_beneficiary_has_working_experience: { type: "boolean" },
    potential_beneficiary_experience_additional_information: { type: "text" },
    potential_beneficiary_date_preferences: { type: "text" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(tableName, [
    "potential_beneficiary_has_working_experience",
    "potential_beneficiary_experience_additional_information",
    "potential_beneficiary_date_preferences",
  ]);
}
