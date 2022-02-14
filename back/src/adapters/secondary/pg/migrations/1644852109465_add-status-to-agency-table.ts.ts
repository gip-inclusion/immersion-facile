import type { MigrationBuilder } from "node-pg-migrate";

const timestampWithTz = (pgm: MigrationBuilder) => ({
  type: "timestamptz",
  notNull: true,
  default: pgm.func("now()"),
});

const timestamp = (pgm: MigrationBuilder) => ({
  type: "timestamp",
  notNull: false,
  default: pgm.func("now()"),
});

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("agencies", {
    status: { type: "varchar(255)", default: "needsReview" },
  });

  await pgm.sql("UPDATE agencies SET status = 'active' WHERE status = NULL");

  pgm.alterColumn("agencies", "status", {
    type: "varchar(255)",
    notNull: true,
    default: "needsReview",
  });
  pgm.alterColumn("agencies", "created_at", timestampWithTz(pgm));
  pgm.alterColumn("agencies", "updated_at", timestampWithTz(pgm));
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("agencies", "status");
  pgm.alterColumn("agencies", "created_at", timestamp(pgm));
  pgm.alterColumn("agencies", "updated_at", timestamp(pgm));
}
