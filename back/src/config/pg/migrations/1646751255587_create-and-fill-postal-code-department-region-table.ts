import * as fs from "node:fs";
import type { MigrationBuilder } from "node-pg-migrate";

export const up = async (pgm: MigrationBuilder) => {
  pgm.sql(
    fs
      .readFileSync(
        `${__dirname}/../static-data/postal_code_department_region.sql`,
      )
      .toString("utf8"),
  );
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("postal_code_department_region");
};
