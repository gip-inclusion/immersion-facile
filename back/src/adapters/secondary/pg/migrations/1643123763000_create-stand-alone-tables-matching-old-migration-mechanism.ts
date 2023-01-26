import type { MigrationBuilder } from "node-pg-migrate";

const timestampNullable = (pgm: MigrationBuilder) => ({
  type: "timestamp",
  default: pgm.func("now()"),
});

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable("outbox", {
    id: { type: "uuid", primaryKey: true },
    occurred_at: { type: "timestamptz", notNull: true },
    was_published: { type: "bool", default: false },
    was_quarantined: { type: "bool", default: false },
    topic: { type: "varchar(255)", notNull: true },
    payload: { type: "jsonb", notNull: true },
  });

  pgm.createExtension("postgis", { ifNotExists: true });

  pgm.createTable("agencies", {
    id: { type: "uuid", primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    counsellor_emails: { type: "jsonb", notNull: true },
    validator_emails: { type: "jsonb", notNull: true },
    admin_emails: { type: "jsonb", notNull: true },
    questionnaire_url: { type: "varchar(255)", notNull: true },
    email_signature: { type: "varchar(255)", notNull: true },
    address: { type: "varchar(255)" },
    position: {
      type: "geography",
      notNull: true,
      default: pgm.func("st_geographyfromtext('POINT(0.00 0.00)'::text)"),
    },
    created_at: timestampNullable(pgm),
    updated_at: timestampNullable(pgm),
  });

  pgm.createTable("romes_public_data", {
    code_rome: { type: "char(5)", primaryKey: true },
    libelle_rome: { type: "varchar(255)", notNull: true },
    libelle_rome_tsvector: { type: "tsvector" },
  });

  pgm.createTable("appellations_public_data", {
    ogr_appellation: "id",
    code_rome: { type: "varchar(5)", notNull: true },
    libelle_appellation_long: { type: "varchar(255)", notNull: true },
    libelle_appellation_court: { type: "varchar(255)", notNull: true },
    libelle_appellation_long_tsvector: { type: "tsvector" },
  });

  createRomeAndAppellationIndexesAndConstraints(pgm);
};

const createRomeAndAppellationIndexesAndConstraints = (
  pgm: MigrationBuilder,
) => {
  pgm.createExtension("pg_trgm", { ifNotExists: true, schema: "pg_catalog" });

  pgm.createIndex("romes_public_data", "libelle_rome_tsvector", {
    name: "textsearch_libelle_rome",
    method: "gin",
  });
  pgm.createIndex("romes_public_data", "libelle_rome gin_trgm_ops", {
    name: "textsearch_libelle_rome_like",
    method: "gin",
  });
  pgm.createIndex(
    "appellations_public_data",
    "libelle_appellation_long_tsvector",
    {
      name: "textsearch_libelle_appellation_long",
      method: "gin",
    },
  );
  pgm.createIndex(
    "appellations_public_data",
    "libelle_appellation_long gin_trgm_ops",
    {
      name: "textsearch_libelle_appellation_long_like",
      method: "gin",
    },
  );

  pgm.addConstraint("appellations_public_data", "fk_rome_code", {
    foreignKeys: {
      columns: "code_rome",
      references: `romes_public_data(code_rome)`,
    },
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("outbox");
  pgm.dropTable("agencies");
  pgm.dropIndex(
    "appellations_public_data",
    "libelle_appellation_long_tsvector",
    {
      name: "textsearch_libelle_appellation_long",
    },
  );
  pgm.dropIndex("appellations_public_data", "libelle_appellation_long", {
    name: "textsearch_libelle_appellation_long_like",
  });
  pgm.dropTable("appellations_public_data");
  pgm.dropIndex("romes_public_data", "libelle_rome_tsvector", {
    name: "textsearch_libelle_rome",
  });
  pgm.dropIndex("romes_public_data", "libelle_rome", {
    name: "textsearch_libelle_rome_like",
  });
  pgm.dropTable("romes_public_data");
};
