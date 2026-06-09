import type { MigrationBuilder } from "node-pg-migrate";

const constraintName = "unique_group_slug_siret";
const groupsSiretsTableName = "groups__sirets";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint(groupsSiretsTableName, constraintName, {
    unique: ["group_slug", "siret"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(groupsSiretsTableName, constraintName);
}
