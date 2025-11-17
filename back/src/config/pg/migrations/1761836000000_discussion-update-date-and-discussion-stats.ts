/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("discussions", {
    updated_at: {
      type: "timestamptz",
      notNull: false,
    },
  });

  pgm.sql(`
    UPDATE discussions
    SET updated_at = COALESCE (
      (
        SELECT MAX(exchanges.sent_at)
        FROM exchanges
        WHERE exchanges.discussion_id = discussions.id
      ),
      created_at
    ) + interval '3 months'
    WHERE discussions.rejection_kind = 'DEPRECATED'
  `);

  pgm.sql(`
    UPDATE discussions
    SET updated_at = COALESCE (
      (
        SELECT MAX(ex.sent_at)
        FROM exchanges ex
        WHERE ex.discussion_id = discussions.id
      ),
      created_at
    )
    WHERE discussions.rejection_kind != 'DEPRECATED'
    OR discussions.rejection_kind IS NULL
  `);

  pgm.alterColumn("discussions", "updated_at", {
    notNull: true,
  });
  pgm.alterColumn("discussions", "status", {
    notNull: true,
    default: null,
  });
  pgm.createIndex("discussions", "status");
  pgm.createIndex("discussions", "updated_at");

  pgm.createTable("discussions_archives", {
    siret: { type: "char(14)", notNull: true },
    kind: { type: "text", notNull: true },
    status: { type: "discussion_status", notNull: true },
    contact_method: { type: "text", notNull: true },
    immersion_objective: { type: "immersion_objectives", notNull: false },
    department_code: { type: "text", notNull: true },
    candidate_firstname: { type: "text", notNull: true },
    creation_date: { type: "date", notNull: true },
    appellation_code: { type: "int", notNull: true },
    discussions_total: { type: "int", notNull: true },
    discussions_answered_by_establishment: { type: "int", notNull: true },
    discussions_with_convention: { type: "int", notNull: true },
  });
  pgm.addConstraint(
    "discussions_archives",
    "fk_ogr_appellation_public_appellations_data",
    {
      foreignKeys: {
        columns: "appellation_code",
        references: "public_appellations_data(ogr_appellation)",
      },
    },
  );
  pgm.addConstraint(
    "discussions_archives",
    "unique_siret_kind_status_contact_method_immersion_objective_department_code_candidate_firstname_creation_date_appellation_code",
    {
      unique: [
        "siret",
        "kind",
        "status",
        "contact_method",
        "immersion_objective",
        "department_code",
        "candidate_firstname",
        "creation_date",
        "appellation_code",
      ],
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("discussions", "updated_at");
  pgm.dropIndex("discussions", "status");
  pgm.dropColumn("discussions", "updated_at");
  pgm.dropTable("discussions_archives");
}
