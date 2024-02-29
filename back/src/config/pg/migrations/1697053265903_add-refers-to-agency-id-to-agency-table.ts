import { MigrationBuilder } from "node-pg-migrate";

const agencyTable = "agencies";
const refersToAgencyIdColumn = "refers_to_agency_id";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(agencyTable, {
    [refersToAgencyIdColumn]: {
      type: "uuid",
      references: agencyTable,
      onDelete: "CASCADE",
      notNull: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn(agencyTable, refersToAgencyIdColumn);
}
