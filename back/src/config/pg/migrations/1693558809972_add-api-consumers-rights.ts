/* eslint-disable @typescript-eslint/naming-convention */
import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

const apiConsumersTable = "api_consumers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const defaultRights = {
    searchEstablishment: {
      kinds: [],
      scope: "no-scope",
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
        agencyIds: [],
      },
    },
  };
  const rights = {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
        agencyIds: [],
      },
    },
  };

  pgm.addColumn(apiConsumersTable, {
    rights: {
      type: "jsonb",
      notNull: true,
      default: JSON.stringify(defaultRights),
    },
  });
  pgm.sql(`
UPDATE ${apiConsumersTable}
SET rights = '${JSON.stringify(rights)}'
WHERE is_authorized IS true`);
  pgm.dropColumn(apiConsumersTable, "is_authorized");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(apiConsumersTable, {
    is_authorized: {
      type: "boolean",
      notNull: false,
      default: false,
    },
  });
  pgm.sql(`
UPDATE ${apiConsumersTable}
SET is_authorized = true
WHERE rights -> 'searchEstablishment'->'kinds' ? 'READ'`);
  pgm.dropColumn(apiConsumersTable, "rights");
}
