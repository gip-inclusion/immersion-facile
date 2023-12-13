import { MigrationBuilder } from "node-pg-migrate";

const formEstablishmentTableName = "form_establishments";
const establishmentEntityTableName = "establishments";
const nextAvailabilityDateColumnName = "next_availability_date";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(formEstablishmentTableName, {
    [nextAvailabilityDateColumnName]: {
      type: "timestamptz",
      notNull: false,
    },
  });
  pgm.addColumn(establishmentEntityTableName, {
    [nextAvailabilityDateColumnName]: {
      type: "timestamptz",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(formEstablishmentTableName, nextAvailabilityDateColumnName);
  pgm.dropColumn(establishmentEntityTableName, nextAvailabilityDateColumnName);
}
