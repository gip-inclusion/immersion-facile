/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const tableName = "api_consumers_subscriptions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(tableName, {
    id: {
      type: "uuid",
      primaryKey: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("now()"),
    },
    right_name: {
      type: "text", // ou un type custom ?
      notNull: true,
    },
    callback_url: {
      type: "text",
      notNull: true,
    },
    callback_headers: {
      type: "jsonb",
      notNull: true,
    },
    consumer_id: {
      type: "uuid",
      notNull: true,
    },
    subscribed_event: {
      type: "text",
      notNull: true,
    },
  });

  pgm.addConstraint(tableName, `fk_consumer_id`, {
    foreignKeys: {
      columns: "consumer_id",
      references: "api_consumers(id)",
      onDelete: "CASCADE",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(tableName);
}
