/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationBuilder } from "node-pg-migrate";

const conventionTableName = "conventions";
const conventionDraftsTableName = "convention_drafts";
const conventionTemplatesTableName = "convention_templates";
const columnName = "remote_work_mode";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(conventionTableName, {
    [columnName]: {
      type: "text",
      notNull: true,
      default: "ON_SITE",
    },
  });

  pgm.alterColumn(conventionTableName, columnName, {
    default: null,
  });

  pgm.addColumn(conventionDraftsTableName, {
    [columnName]: {
      type: "text",
      notNull: false,
    },
  });

  pgm.addColumn(conventionTemplatesTableName, {
    [columnName]: {
      type: "text",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(conventionTableName, columnName);
  pgm.dropColumn(conventionDraftsTableName, columnName);
  pgm.dropColumn(conventionTemplatesTableName, columnName);
}
