import { MigrationBuilder } from "node-pg-migrate";

const usersAgenciesTableName = "users__agencies";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(usersAgenciesTableName, {
    user_id: {
      type: "uuid",
      notNull: true,
      references: { name: "authenticated_users" },
      onDelete: "CASCADE",
    },
    agency_id: {
      type: "uuid",
      notNull: true,
      references: { name: "agencies" },
      onDelete: "CASCADE",
    },
  });
  pgm.addConstraint("users__agencies", "unique_user_id_agency_id", {
    unique: ["user_id", "agency_id"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(usersAgenciesTableName);
}
