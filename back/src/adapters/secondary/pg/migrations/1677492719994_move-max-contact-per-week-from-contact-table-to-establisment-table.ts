import { MigrationBuilder } from "node-pg-migrate";

const contactTableName = "immersion_contacts";
const maxContactPerWeekCol = "max_contact_per_week";
const establishmentTableName = "establishments";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(contactTableName, maxContactPerWeekCol);
  pgm.addColumn(establishmentTableName, {
    [maxContactPerWeekCol]: { type: "int4", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(establishmentTableName, maxContactPerWeekCol);
  pgm.addColumn(contactTableName, {
    [maxContactPerWeekCol]: { type: "int4", notNull: false },
  });
}
