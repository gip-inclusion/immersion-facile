/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("archived_convention_requests", {
    id: { type: "uuid", primaryKey: true },
    user_id: { type: "uuid", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    convention_id: { type: "uuid" },
    beneficiary_first_name: { type: "varchar(255)" },
    beneficiary_last_name: { type: "varchar(255)" },
    siret: { type: "char(14)" },
    immersion_date: { type: "varchar(255)" },
    immersion_appellation: { type: "integer" },
    reason: { type: "varchar(100)", notNull: true },
    other_reason: { type: "varchar(100)" },
  });

  pgm.addConstraint(
    "archived_convention_requests",
    "archived_convention_requests_user_id_fk",
    {
      foreignKeys: {
        columns: "user_id",
        references: "users(id)",
      },
    },
  );

  pgm.addConstraint(
    "archived_convention_requests",
    "archived_convention_requests_immersion_appellation_fk",
    {
      foreignKeys: {
        columns: "immersion_appellation",
        references: "public_appellations_data(ogr_appellation)",
      },
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("archived_convention_requests");
}
