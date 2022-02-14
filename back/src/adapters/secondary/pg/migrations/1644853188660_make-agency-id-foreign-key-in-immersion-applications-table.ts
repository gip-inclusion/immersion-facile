import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint("immersion_applications", "fk_agency_id", {
    foreignKeys: {
      columns: "agency_id",
      references: `agencies(id)`,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("immersion_applications", "fk_agency_id");
}
