import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`CREATE OR REPLACE FUNCTION date_to_iso(date timestamptz)
            RETURNS text
            language plpgsql
          AS
          $$
          DECLARE date_char text;
          BEGIN
            SELECT TO_CHAR(date::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') INTO date_char;
            RETURN date_char;
          END;
          $$
`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DROP FUNCTION date_to_iso");
}
