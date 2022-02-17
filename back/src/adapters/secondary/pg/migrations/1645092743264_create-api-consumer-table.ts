/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("api_consumers", {
    id: { type: "uuid", primaryKey: true },
    consumer: { type: "varchar(255)", notNull: true },
    description: { type: "varchar(255)" },
    is_authorized: { type: "bool", notNull: true },
    created_at: { type: "timestamptz", notNull: true },
    expiration_date: { type: "timestamptz", notNull: true },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("api_consumers");
}
