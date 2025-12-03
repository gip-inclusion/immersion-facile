import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE stats__most_frequent_searches (
      day DATE NOT NULL,
      appellation_code VARCHAR(6),
      address TEXT,
      department_code VARCHAR(3),
      count INTEGER NOT NULL
    );
  `);

  pgm.sql(`
    INSERT INTO stats__most_frequent_searches (day, appellation_code, address, department_code, count)
    SELECT day, appellation_code, address, department_code, count
    FROM most_frequent_searches;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX ON stats__most_frequent_searches (
      day,
      COALESCE(appellation_code, ''),
      COALESCE(address, ''),
      COALESCE(department_code, '')
    );
  `);

  pgm.sql("DROP MATERIALIZED VIEW IF EXISTS most_frequent_searches;");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql("DROP TABLE IF EXISTS stats__most_frequent_searches;");
}
