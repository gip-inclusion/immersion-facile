import { MigrationBuilder } from "node-pg-migrate";

const newColumnName = "is_max_discussions_for_period_reached";
const oldColumnName = "is_searchable";
const establishmentTableName = "establishments";

export async function up(pgm: MigrationBuilder): Promise<void> {
  migration(pgm, "up");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  migration(pgm, "down");
}

const migration = (pgm: MigrationBuilder, mode: "up" | "down") => {
  pgm.renameColumn(
    establishmentTableName,
    mode === "up" ? oldColumnName : newColumnName,
    mode === "up" ? newColumnName : oldColumnName,
  );

  pgm.sql(`
    UPDATE ${establishmentTableName}
    SET ${mode === "up" ? newColumnName : oldColumnName} = NOT ${
      mode === "up" ? newColumnName : oldColumnName
    }
  `);
};
