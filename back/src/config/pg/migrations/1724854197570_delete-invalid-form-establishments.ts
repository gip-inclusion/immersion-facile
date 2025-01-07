import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(`
    WITH FormEstablishmentWithoutBusinessAddress AS (
      SELECT siret
      FROM form_establishments
      WHERE business_addresses::TEXT LIKE '%11111111-2222-4444-1111-111111111111%'
      ), FormEstablishmentFailedToEstablishment AS (
        SELECT payload -> 'formEstablishment' ->> 'siret' AS siret
        FROM outbox
        WHERE was_quarantined IS TRUE
          AND status = 'failed-to-many-times'
          AND topic = 'FormEstablishmentAdded'
          AND payload -> 'formEstablishment' ->> 'siret' IN (
           SELECT siret FROM FormEstablishmentWithoutBusinessAddress
          )
          AND occurred_at < '2024-03-01'
      )
      DELETE FROM form_establishments fe
      WHERE EXISTS (
          SELECT 1
          FROM FormEstablishmentFailedToEstablishment fft
                   LEFT JOIN establishments e ON e.siret = fft.siret
          WHERE fft.siret = fe.siret
            AND e.siret IS NULL
      )
  `);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
