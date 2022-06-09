/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_applications", "immersion_skills", {
    notNull: true,
  });
  pgm.alterColumn("immersion_applications", "sanitary_prevention_description", {
    notNull: true,
  });
  pgm.alterColumn("immersion_applications", "immersion_address", {
    notNull: true,
  });
  pgm.alterColumn("immersion_applications", "immersion_objective", {
    notNull: true,
  });
  pgm.alterColumn("immersion_applications", "phone", { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("immersion_applications", "immersion_skills", {
    notNull: false,
  });
  pgm.alterColumn("immersion_applications", "sanitary_prevention_description", {
    notNull: false,
  });
  pgm.alterColumn("immersion_applications", "immersion_address", {
    notNull: false,
  });
  pgm.alterColumn("immersion_applications", "immersion_objective", {
    notNull: false,
  });
  pgm.alterColumn("immersion_applications", "phone", { notNull: false });
}
