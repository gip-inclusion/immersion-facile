import type { MigrationBuilder } from "node-pg-migrate";

const defaultPriority = 5;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("outbox", "priority", {
    default: defaultPriority,
  });

  pgm.alterColumn("outbox", "priority", {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.alterColumn("outbox", "priority", {
    notNull: false,
  });
  pgm.sql(`
    UPDATE outbox
    SET priority = NULL
    WHERE priority = ${defaultPriority};
  `);
}
