import type { MigrationBuilder } from "node-pg-migrate";

const contactTableName = "immersion_contacts";
const maxContactPerWeekCol = "max_contacts_per_week";
const establishmentTableName = "establishments";
const formEstablishmentsTableName = "form_establishments";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(contactTableName, "max_contact_per_week");
  pgm.addColumn(establishmentTableName, {
    [maxContactPerWeekCol]: { type: "int4", notNull: false },
  });
  pgm.addColumn(formEstablishmentsTableName, {
    [maxContactPerWeekCol]: { type: "int4", notNull: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(establishmentTableName, maxContactPerWeekCol);
  pgm.addColumn(contactTableName, {
    ["max_contact_per_week"]: { type: "int4", notNull: false },
  });
  pgm.dropColumn(formEstablishmentsTableName, maxContactPerWeekCol);
}
