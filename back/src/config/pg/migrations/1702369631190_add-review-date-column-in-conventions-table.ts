import { MigrationBuilder } from "node-pg-migrate";

const conventionTable = "conventions";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(conventionTable, {
    date_approval: {
      type: "timestamptz",
      notNull: false,
    },
  });

  pgm.sql(`
   WITH filtered_outbox AS (
    SELECT
    outbox.occurred_at AS review_occured_at,
    (outbox.payload -> 'convention' ->> 'id'::text) AS convention_id
    FROM outbox
  WHERE outbox.topic = 'ConventionAcceptedByCounsellor'
   )
    UPDATE conventions AS c
    SET date_approval = filtered_outbox.review_occured_at
    FROM filtered_outbox
    WHERE filtered_outbox.convention_id = c.id::text
   `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(conventionTable, "date_approval");
}
