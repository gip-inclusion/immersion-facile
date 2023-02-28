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
  pgm.sql(
    "UPDATE form_establishments SET max_contacts_per_week=0 WHERE is_searchable=false",
  );
  pgm.alterColumn(establishmentTableName, maxContactsPerWeekCol, {
    default: null,
  });
  pgm.alterColumn(formEstablishmentsTableName, maxContactsPerWeekCol, {
    default: null,
  });
  pgm.dropColumn(formEstablishmentsTableName, "is_searchable");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    "UPDATE establishments SET is_searchable=false WHERE max_contacts_per_week=0",
  );
  pgm.dropColumn(establishmentTableName, maxContactsPerWeekCol);

  pgm.addColumn(contactTableName, {
    ["max_contact_per_week"]: { type: "int4", notNull: false },
  });

  pgm.addColumn(formEstablishmentsTableName, {
    is_searchable: { type: "bool", notNull: true, default: true },
  });
  pgm.sql(
    "UPDATE form_establishments SET is_searchable=false WHERE max_contacts_per_week=0",
  );
  pgm.dropColumn(formEstablishmentsTableName, maxContactsPerWeekCol);
}
