import { MigrationBuilder } from "node-pg-migrate";

const discussionsTable = "discussions";
const potentialBeneficiaryEmailUuidColumn = "potential_beneficiary_email_uuid";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(discussionsTable, {
    [potentialBeneficiaryEmailUuidColumn]: {
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
  });

  // we want to force new entries to provide a valid uuid
  pgm.alterColumn(discussionsTable, potentialBeneficiaryEmailUuidColumn, {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(discussionsTable, [potentialBeneficiaryEmailUuidColumn]);
}
