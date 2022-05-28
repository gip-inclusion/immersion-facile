import { MigrationBuilder, PgLiteral } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_applications", "pe_external_id");

  // The primary key is the combination user_pe_external_id/convention_id
  // We set a fixed default value of type uuid for convention_id
  pgm.createTable("partners_pe_connect", {
    user_pe_external_id: { type: "uuid", notNull: true, primaryKey: true },
    convention_id: {
      type: "uuid",
      primaryKey: true,
      default: new PgLiteral("'00000000-0000-0000-0000-000000000000'"),
    },
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
