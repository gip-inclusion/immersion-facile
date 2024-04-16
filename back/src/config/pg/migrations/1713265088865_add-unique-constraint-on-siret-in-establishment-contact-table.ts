/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const constraintName = "contact_unique_siret";
const establishmentsContactTableName = "establishments_contacts";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(establishmentsContactTableName, constraintName, {
    unique: ["siret"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(establishmentsContactTableName, constraintName);
}
