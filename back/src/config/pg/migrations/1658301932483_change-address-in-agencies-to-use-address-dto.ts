import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("agencies", "address", "legacy_address");
  pgm.alterColumn("agencies", "legacy_address", { notNull: false });
  pgm.addColumns("agencies", {
    street_number_and_address: { type: "text", notNull: true, default: "" },
    post_code: { type: "text", notNull: true, default: "" },
    city: { type: "text", notNull: true, default: "" },
    department_code: { type: "text", notNull: true, default: "" },
  });

  // Add security if fields are not provided, without that the field will be set to ""
  pgm.alterColumn("agencies", "street_number_and_address", { default: null });
  pgm.alterColumn("agencies", "post_code", { default: null });
  pgm.alterColumn("agencies", "department_code", { default: null });
  pgm.alterColumn("agencies", "city", { default: null });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("agencies", "legacy_address", "address");
  pgm.alterColumn("agencies", "address", { notNull: true });
  pgm.dropColumns("agencies", [
    "street_number_and_address",
    "post_code",
    "department_code",
    "city",
  ]);
}
