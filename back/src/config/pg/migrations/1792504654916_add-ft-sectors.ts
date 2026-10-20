import fs from "node:fs";
import type { MigrationBuilder } from "node-pg-migrate";
import format from "pg-format";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("ft_sectors", {
    code: { type: "text", primaryKey: true },
    label: { type: "text", notNull: true },
  });

  pgm.createTable("ft_sectors__naf", {
    ft_sector_code: {
      type: "text",
      notNull: true,
      primaryKey: true,
      references: "ft_sectors(code)",
    },
    naf_code: {
      type: "char(5)",
      notNull: true,
      primaryKey: true,
      references: "public_naf_rev2_sous_classes(naf_code)",
    },
  });
  pgm.createIndex("ft_sectors__naf", "naf_code");

  pgm.createTable("ft_sectors__rome", {
    ft_sector_code: {
      type: "text",
      notNull: true,
      primaryKey: true,
      references: "ft_sectors(code)",
    },
    rome_code: {
      type: "char(5)",
      notNull: true,
      primaryKey: true,
    },
  });
  pgm.createIndex("ft_sectors__rome", "rome_code");

  pgm.sql(
    format(
      "INSERT INTO ft_sectors (code, label) VALUES %L",
      readStaticDataCsv("ft_sectors.csv"),
    ),
  );

  pgm.sql(
    format(
      "INSERT INTO ft_sectors__naf (ft_sector_code, naf_code) VALUES %L",
      readStaticDataCsv("ft_sectors__naf.csv"),
    ),
  );

  pgm.sql(
    format(
      "INSERT INTO ft_sectors__rome (ft_sector_code, rome_code) VALUES %L",
      readStaticDataCsv("ft_sectors__rome.csv"),
    ),
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("ft_sectors__rome");
  pgm.dropTable("ft_sectors__naf");
  pgm.dropTable("ft_sectors");
}

const readStaticDataCsv = (fileName: string): string[][] =>
  fs
    .readFileSync(`${__dirname}/../static-data/${fileName}`, "utf-8")
    .split("\n")
    .slice(1)
    .filter((line) => line !== "")
    .map((line) => line.split(";"));
