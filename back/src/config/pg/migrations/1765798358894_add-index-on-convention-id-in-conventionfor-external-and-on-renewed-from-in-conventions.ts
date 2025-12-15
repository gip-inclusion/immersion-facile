/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("convention_external_ids", "convention_id", {
    name: "convention_external_ids_convention_id_idx",
  });

  pgm.createIndex("conventions", "renewed_from", {
    name: "conventions_renewed_from_idx",
    where: "renewed_from IS NOT NULL",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("convention_external_ids", "convention_id", {
    name: "convention_external_ids_convention_id_idx",
  });

  pgm.dropIndex("conventions", "renewed_from", {
    name: "conventions_renewed_from_idx",
  });
}
