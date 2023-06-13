import * as fs from "fs";
import type { MigrationBuilder } from "node-pg-migrate";

export const up = async (pgm: MigrationBuilder) => {
  pgm.sql(
    fs
      .readFileSync(
        `${__dirname}/../staticData/postal_code_department_region.sql`,
      )
      .toString("utf8"),
  );
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("postal_code_department_region");
};
