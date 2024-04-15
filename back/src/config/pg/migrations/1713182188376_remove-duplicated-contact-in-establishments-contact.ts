/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`WITH RankedEntries AS (
    SELECT ec.uuid,
           ROW_NUMBER() OVER (PARTITION BY ec.siret, ec.email ORDER BY ec.uuid) AS rn
    FROM establishments_contacts ec
    JOIN (
        SELECT siret
        FROM establishments_contacts
        GROUP BY siret
        HAVING COUNT(*) > 1
    ) b ON ec.siret = b.siret
)
DELETE FROM establishments_contacts
WHERE uuid IN (
    SELECT uuid FROM RankedEntries WHERE rn > 1
);`);
}

export async function down(_pgm: MigrationBuilder): Promise<void> {}
