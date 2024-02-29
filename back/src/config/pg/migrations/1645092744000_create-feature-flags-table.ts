import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("feature_flags", {
    flag_name: { type: "varchar(255)", primaryKey: true },
    is_active: { type: "bool", notNull: true },
  });
  await pgm.sql(
    "INSERT INTO feature_flags (flag_name, is_active) VALUES ('enableAdminUi', true);",
  );
  await pgm.sql(
    "INSERT INTO feature_flags (flag_name, is_active) VALUES ('enableByPassInseeApi', false);",
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("feature_flags");
}
