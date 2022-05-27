/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    "immersion_assessments",
    "immersion_assessments_convention_id_fkey",
  );
  pgm.addConstraint(
    "immersion_assessments",
    "immersion_assessments_convention_id_fkey",
    {
      foreignKeys: {
        columns: "convention_id",
        references: "immersion_applications(id)",
        onDelete: "CASCADE", // If an convention is deleted, will delete the referencing assessment
      },
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    "immersion_assessments",
    "immersion_assessments_convention_id_fkey",
  );
  pgm.addConstraint(
    "immersion_assessments",
    "immersion_assessments_convention_id_fkey",
    {
      foreignKeys: {
        columns: "convention_id",
        references: "immersion_applications(id)",
      },
    },
  );
}
