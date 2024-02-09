import { MigrationBuilder } from "node-pg-migrate";

const tableName = "form_establishments";
const oldColumnName = "business_address";
const newColumnName = "business_addresses";
export async function up(pgm: MigrationBuilder): Promise<void> {
  // create new column of type jsonb array (empty array by default)
  pgm.addColumn(tableName, {
    [newColumnName]: {
      type: "JSONB",
      notNull: false,
    },
  });
  // copy old data to new column
  pgm.sql(`
    UPDATE ${tableName}
    SET ${newColumnName} = jsonb_build_array(${oldColumnName});
  `);

  pgm.alterColumn(tableName, newColumnName, {
    notNull: true,
  });

  pgm.dropColumn(tableName, oldColumnName);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // create old column
  pgm.addColumn(tableName, {
    [oldColumnName]: {
      type: "TEXT",
      notNull: false,
    },
  });
  // copy new data to old column
  pgm.sql(`
    UPDATE ${tableName}
    SET ${oldColumnName} = ${newColumnName}->>0;
  `);
  pgm.alterColumn(tableName, oldColumnName, {
    notNull: true,
  });

  pgm.dropColumn(tableName, newColumnName);
}
