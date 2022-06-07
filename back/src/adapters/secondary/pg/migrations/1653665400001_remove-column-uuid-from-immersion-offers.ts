import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("immersion_offers", "uuid");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  await pgm.sql(
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
     ALTER TABLE immersion_offers ADD uuid uuid PRIMARY KEY DEFAULT uuid_generate_v4();`,
  );
}
