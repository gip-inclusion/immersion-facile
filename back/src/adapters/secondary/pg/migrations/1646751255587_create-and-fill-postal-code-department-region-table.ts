import * as fse from "fs-extra";
import type { MigrationBuilder } from "node-pg-migrate";

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
