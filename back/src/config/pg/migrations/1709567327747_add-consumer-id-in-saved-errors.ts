import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("api_consumers", "consumer", "name");
  pgm.addColumns("saved_errors", {
    consumer_id: {
      type: "uuid",
      default: null,
      notNull: false,
      references: "api_consumers(id)",
    },
    consumer_name: {
      type: "varchar(255)",
      default: null,
      notNull: false,
    },
  });

  pgm.sql(
    "UPDATE saved_errors SET consumer_name = 'France Travail' WHERE service_name = 'PoleEmploiGateway.notifyOnConventionUpdated'",
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn("api_consumers", "name", "consumer");
  pgm.dropColumn("saved_errors", "consumer_id");
  pgm.dropColumn("saved_errors", "consumer_name");
}
