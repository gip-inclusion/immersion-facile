import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("agencies", {
    kind: { type: "varchar(255)" },
  });

  await pgm.sql("UPDATE agencies SET kind = 'autre' WHERE kind IS NULL");

  pgm.alterColumn("agencies", "kind", { notNull: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("agencies", "kind");
}
