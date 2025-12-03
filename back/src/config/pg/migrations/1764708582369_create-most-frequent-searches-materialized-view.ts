import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE MATERIALIZED VIEW most_frequent_searches AS
    WITH aggregated AS (
        SELECT
            date(update_date) as day,
            ap.appellation_code,
            address,
            department_code,
            count(searches_made.id) as count
        FROM searches_made
        LEFT JOIN searches_made__appellation_code ap ON searches_made.id = ap.search_made_id
        WHERE update_date >= CURRENT_DATE - INTERVAL '1 year'
          AND update_date <= CURRENT_DATE
          AND voluntary_to_immersion != false
        GROUP BY date(update_date), ap.appellation_code, address, department_code
    ),
    ranked AS (
        SELECT *,
            ROW_NUMBER() OVER (PARTITION BY day ORDER BY count DESC) as rn
        FROM aggregated
    )
    SELECT day, appellation_code, address, department_code, count
    FROM ranked
    WHERE rn <= 1000;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX ON most_frequent_searches (
        day,
        COALESCE(appellation_code, ''),
        COALESCE(address, ''),
        COALESCE(department_code, '')
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DROP MATERIALIZED VIEW IF EXISTS most_frequent_searches;");
}
