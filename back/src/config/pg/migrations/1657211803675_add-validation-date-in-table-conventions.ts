import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("conventions", {
    date_validation: {
      type: "timestamptz",
      notNull: false,
    },
  });
  pgm.sql(`
   WITH filtered_outbox AS (
     SELECT
       outbox.occurred_at AS validation_occured_at,
       (outbox.payload ->> 'id'::text) AS convention_id
       FROM outbox
     WHERE outbox.topic IN ('ImmersionApplicationAcceptedByValidator', 'FinalImmersionApplicationValidationByAdmin')
   )
    UPDATE conventions AS c
    SET date_validation = filtered_outbox.validation_occured_at
    FROM filtered_outbox
    WHERE filtered_outbox.convention_id = c.id::text
   `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("conventions", "date_validation");
}
