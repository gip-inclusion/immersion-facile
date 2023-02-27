import type { MigrationBuilder } from "node-pg-migrate";

const contactTableName = "immersion_contacts";
const maxContactsPerWeekCol = "max_contacts_per_week";
const establishmentTableName = "establishments";
const formEstablishmentsTableName = "form_establishments";
const defaultMaxContactsPerWeek = 10;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(contactTableName, "max_contact_per_week");
  pgm.addColumn(establishmentTableName, {
    [maxContactsPerWeekCol]: {
      type: "int4",
      notNull: true,
      default: defaultMaxContactsPerWeek,
    },
  });
  pgm.addColumn(formEstablishmentsTableName, {
    [maxContactsPerWeekCol]: {
      type: "int4",
      notNull: true,
      default: defaultMaxContactsPerWeek,
    },
  });
  pgm.sql(
    "UPDATE establishments SET max_contacts_per_week=0 WHERE is_searchable=false",
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(establishmentTableName, maxContactsPerWeekCol);
  pgm.addColumn(contactTableName, {
    ["max_contact_per_week"]: { type: "int4", notNull: false },
  });
  pgm.dropColumn(formEstablishmentsTableName, maxContactsPerWeekCol);
}
