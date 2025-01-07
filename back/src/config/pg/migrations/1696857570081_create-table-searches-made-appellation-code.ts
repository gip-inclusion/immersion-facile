import { MigrationBuilder } from "node-pg-migrate";

const newTableName = "searches_made__appellation_code";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(newTableName, {
    search_made_id: {
      type: "uuid",
      notNull: true,
      references: { name: "searches_made" },
      onDelete: "CASCADE",
    },
    appellation_code: {
      type: "varchar(6)",
      notNull: false,
      default: null,
    },
  });
  pgm.addConstraint(newTableName, `${newTableName}_unicity`, {
    unique: ["search_made_id", "appellation_code"],
  });
  await moveAppellationCodeFromOldTable(pgm); // met environ 3m sur la db nightly
  pgm.dropColumn("searches_made", "appellation_code");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("searches_made", {
    appellation_code: { type: "varchar(6)", notNull: false, default: null },
  });
  await moveAppellationCodeFromNewTable(pgm); // met envrion 30m sur la db nightly
  pgm.dropTable(newTableName);
}

const moveAppellationCodeFromOldTable = async (pgm: MigrationBuilder) => {
  await pgm.sql(`
  INSERT INTO ${newTableName}
      (SELECT id, appellation_code FROM searches_made)
  `);
};

const moveAppellationCodeFromNewTable = async (pgm: MigrationBuilder) => {
  await pgm.sql(`
  UPDATE searches_made
      SET id = ${newTableName}.search_made_id, appellation_code = ${newTableName}.appellation_code
  FROM ${newTableName}
  WHERE searches_made.id = ${newTableName}.search_made_id
  `);
};
