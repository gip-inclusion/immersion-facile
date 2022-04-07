import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("searches_made", {
    voluntary_to_immersion: { type: "boolean" },
  });
  pgm.addColumn("searches_made", {
    api_consumer_name: { type: "varchar(255)" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("searches_made", "voluntary_to_immersion");
  pgm.dropColumn("searches_made", "api_consumer_name");
}
