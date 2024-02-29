import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable("public_appelations_data", "public_appellations_data");

  pgm.addColumns("public_appellations_data", {
    libelle_appellation_long_without_special_char: {
      type: "text",
    },
  });

  pgm.createExtension("unaccent");

  // copy libelle_appellation_long and ignore accents and remove parentheses
  pgm.sql(`UPDATE public_appellations_data
        SET libelle_appellation_long_without_special_char = unaccent(
          REGEXP_REPLACE("libelle_appellation_long", '[()]', '', 'g')
        )`);

  pgm.alterColumn(
    "public_appellations_data",
    "libelle_appellation_long_without_special_char",
    {
      notNull: true,
    },
  );

  pgm.createIndex(
    "public_appellations_data",
    "libelle_appellation_long_without_special_char gin_trgm_ops",
    {
      name: "textsearch_libelle_appellation_long_without_special_char_like",
      method: "gin",
    },
  );

  pgm.sql(
    `UPDATE public_appellations_data
        SET libelle_appellation_long_tsvector = to_tsvector(
        'french',
        public_appellations_data.libelle_appellation_long_without_special_char
      );`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(
    "public_appellations_data",
    "libelle_appellation_long_without_special_char",
  );
  pgm.dropExtension("unaccent");
  pgm.sql(
    `UPDATE public_appellations_data SET libelle_appellation_long_tsvector = to_tsvector('french', public_appellations_data.libelle_appellation_long);`,
  );
  pgm.renameTable("public_appellations_data", "public_appelations_data");
}
