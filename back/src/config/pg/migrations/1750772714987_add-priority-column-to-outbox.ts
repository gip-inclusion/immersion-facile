import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("outbox", {
    priority: {
      type: "int",
    },
  });
  pgm.addIndex("outbox", "priority");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("outbox", "priority");
}
