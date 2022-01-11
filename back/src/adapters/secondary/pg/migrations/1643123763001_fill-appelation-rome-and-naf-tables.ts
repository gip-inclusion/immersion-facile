import fs from "fs";
import type { MigrationBuilder } from "node-pg-migrate";
import format from "pg-format";
import {
  appellations_public_data,
  romes_public_data,
} from "../staticData/0_table_names";

export const up = async (pgm: MigrationBuilder) => {
  pgm.sql(await buildInsertRomesPublicDataQuery());
  pgm.sql(await buildInsertAppellationPublicDataQuery());
  pgm.sql(
    `UPDATE ${appellations_public_data} SET libelle_appellation_long_tsvector = to_tsvector('french', ${appellations_public_data}.libelle_appellation_long);`,
  );
  pgm.sql(
    `UPDATE ${romes_public_data} SET libelle_rome_tsvector = to_tsvector('french', ${romes_public_data}.libelle_rome);`,
  );
};

export const down = (pgm: MigrationBuilder) => {
  pgm.sql(`TRUNCATE ${appellations_public_data} CASCADE;`);
  pgm.sql(`TRUNCATE ${romes_public_data} CASCADE;`);
};

const makeQueryArray = (filePath: string) => {
  const originalCsv = fs.readFileSync(filePath, "utf-8");
  const rows = originalCsv.split("\r\n");
  const rowsSliced = rows.slice(1, rows.length - 1);
  return rowsSliced.map((element) => element.split(";"));
};

const buildInsertRomesPublicDataQuery = async () => {
  const arrayOfRomeData = makeQueryArray(
    `${__dirname}/../staticData/romes_public.csv`,
  );

  return format(
    `INSERT INTO ${romes_public_data} (code_rome, libelle_rome) VALUES %L`,
    arrayOfRomeData,
  );
};

const buildInsertAppellationPublicDataQuery = async () => {
  const arrayOfAppellationData = makeQueryArray(
    `${__dirname}/../staticData/appellations_public.csv`,
  );

  return format(
    `INSERT INTO ${appellations_public_data} (ogr_appellation, code_rome, libelle_appellation_long, libelle_appellation_court) VALUES %L`,
    arrayOfAppellationData,
  );
};
