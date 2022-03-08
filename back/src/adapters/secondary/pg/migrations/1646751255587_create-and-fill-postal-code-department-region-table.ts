import type { MigrationBuilder } from "node-pg-migrate";
import * as fse from "fs-extra";

export const up = async (pgm: MigrationBuilder) => {
  pgm.sql(
    fse
      .readFileSync(
        `${__dirname}/../staticData/postal_code_department_region.sql`,
      )
      .toString("utf8"),
  );
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("postal_code_department_region");
};
