import { MigrationBuilder } from "node-pg-migrate";

const establishementsTable = "establishments";
const lastInseeCheckDateColumn = "last_insee_check_date";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("establishments", {
    [lastInseeCheckDateColumn]: {
      type: "timestamptz",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(establishementsTable, lastInseeCheckDateColumn);
}
