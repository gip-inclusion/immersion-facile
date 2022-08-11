/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createView(
    "view_outbox_failures",
    { replace: true },
    `SELECT op.published_at,
            of.subscription_id,
            of.error_message,
            o.topic,
            op.id AS pub_id,
            o.id AS event_id,
            o.payload,
            o.was_quarantined
    FROM outbox_failures of
    LEFT JOIN outbox_publications op ON op.id = of.publication_id
    LEFT JOIN outbox o ON o.id = op.event_id
    ORDER BY op.published_at DESC`,
  );
  pgm.createView(
    "view_outbox",
    { replace: true },
    `SELECT op.published_at,
        of.subscription_id,
        of.error_message,
        o.topic,
        op.id AS pub_id,
        o.id AS event_id,
        o.payload,
        o.was_quarantined
    FROM outbox_publications op
    LEFT JOIN outbox_failures of ON op.id = of.publication_id
    LEFT JOIN outbox o ON o.id = op.event_id
    ORDER BY op.published_at DESC`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropView("view_outbox_failures");
  pgm.dropView("view_outbox");
}
