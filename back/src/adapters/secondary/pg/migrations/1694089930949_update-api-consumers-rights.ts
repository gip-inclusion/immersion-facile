/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

const apiConsumersTable = "api_consumers";

export async function up(pgm: MigrationBuilder): Promise<void> {
  const rights = {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
      },
    },
  };

  pgm.sql(`
    UPDATE ${apiConsumersTable}
    SET rights = '${JSON.stringify(rights)}'`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
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

  pgm.sql(`
    UPDATE ${apiConsumersTable}
    SET rights = '${JSON.stringify(rights)}'`);
}
