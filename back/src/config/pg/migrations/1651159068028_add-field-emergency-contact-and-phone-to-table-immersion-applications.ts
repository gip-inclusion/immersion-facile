import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("immersion_applications", {
    emergency_contact: { type: "varchar(255)", notNull: false },
    emergency_contact_phone: { type: "varchar(255)", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("immersion_applications", [
    "emergency_contact",
    "emergency_contact_phone",
  ]);
}
