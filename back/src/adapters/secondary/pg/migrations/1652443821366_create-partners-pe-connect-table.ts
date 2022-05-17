import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_applications", "pe_external_id");

  pgm.createTable("partners_pe_connect", {
    id: { type: "uuid", primaryKey: true },
    user_pe_external_id: { type: "uuid", notNull: true },
    convention_id: { type: "uuid" },
    firstname: { type: "varchar(255)", notNull: true },
    lastname: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(255)", notNull: true },
    type: { type: "varchar(20)", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("immersion_applications", {
    pe_external_id: { type: "varchar(255)" },
  });
  pgm.dropTable("partners_pe_connect");
}
