/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("outbox_publications", {
    id: { type: "serial", primaryKey: true },
    event_id: { type: "uuid", references: "outbox", notNull: true },
    published_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("outbox_failures", {
    id: { type: "serial", primaryKey: true },
    publication_id: {
      type: "int",
      references: "outbox_publications",
      notNull: true,
    },
    subscription_id: { type: "varchar", notNull: true },
    error_message: { type: "varchar" },
  });

  pgm.sql(`
    INSERT INTO outbox_publications (event_id, published_at)
    SELECT id, occurred_at FROM outbox WHERE was_published = true;
    `);

  pgm.dropColumn("outbox", "was_published");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("outbox", { was_published: { type: "bool" } });
  pgm.sql(`
    WITH from_publications as (SELECT event_id FROM outbox_publications)
    UPDATE outbox SET was_published=true FROM from_publications WHERE outbox.id = from_publications.event_id;
    `);

  pgm.dropTable("outbox_failures");
  pgm.dropTable("outbox_publications");
}
