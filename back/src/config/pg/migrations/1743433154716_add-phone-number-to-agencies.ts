import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("agencies", {
    phone_number: { type: "varchar(20)" },
  });

  pgm.sql(
    "UPDATE agencies SET phone_number = '+33600000000' WHERE phone_number IS NULL",
  );

  pgm.alterColumn("agencies", "phone_number", {
    type: "varchar(20)",
    notNull: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("agencies", "phone_number");
}
